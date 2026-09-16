package com.cropdeal.priceservice.service;

import com.cropdeal.priceservice.config.GovernmentApiConfig;
import com.cropdeal.priceservice.dto.CropPriceResponse;
import com.cropdeal.priceservice.dto.GovernmentPriceResponse;
import com.cropdeal.priceservice.dto.PriceSearchRequest;
import com.cropdeal.priceservice.dto.SyncResponse;
import com.cropdeal.priceservice.entity.CommodityUnit;
import com.cropdeal.priceservice.entity.MarketPrice;
import com.cropdeal.priceservice.exception.PriceApiException;
import com.cropdeal.priceservice.repository.CommodityUnitRepository;
import com.cropdeal.priceservice.repository.MarketPriceRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriBuilder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

@Service
public class PriceService {

    private static final String DEFAULT_SOURCE_UNIT = "Rs./Quintal";
    private static final double DEFAULT_KG_PER_UNIT = 100.0;

    private final MarketPriceRepository repository;
    private final CommodityUnitRepository unitRepository;
    private final RestClient governmentRestClient;
    private final GovernmentApiConfig config;

    public PriceService(
            MarketPriceRepository repository,
            CommodityUnitRepository unitRepository,
            RestClient governmentRestClient,
            GovernmentApiConfig config) {
        this.repository = repository;
        this.unitRepository = unitRepository;
        this.governmentRestClient = governmentRestClient;
        this.config = config;
    }

    /**
     * Downloads the current government dataset, discovers the latest arrival date,
     * and stores only that latest daily snapshot. Existing rows are updated and
     * new rows are inserted.
     */
    public SyncResponse syncLatestGovernmentPrices() {
        validateGovernmentConfig();

        int offset = 0;
        int pageSize = Math.max(1, config.getPageSize());
        int processed = 0;
        int inserted = 0;
        int updated = 0;
        LocalDate latestDate = null;
        List<MarketPrice> downloaded = new ArrayList<>();

        while (true) {
            GovernmentPriceResponse page = fetchPage(offset, pageSize);
            List<Map<String, Object>> records = page.getRecords();

            if (records == null || records.isEmpty()) {
                break;
            }

            for (Map<String, Object> record : records) {
                MarketPrice price = fromGovernmentRecord(record);
                if (price.getCommodity() == null || price.getArrivalDate() == null) {
                    continue;
                }

                downloaded.add(price);
                if (latestDate == null || price.getArrivalDate().isAfter(latestDate)) {
                    latestDate = price.getArrivalDate();
                }
            }

            if (records.size() < pageSize) {
                break;
            }
            offset += pageSize;
        }

        if (latestDate == null) {
            return new SyncResponse("Government API returned no valid dated records", 0, 0, 0, null);
        }

        for (MarketPrice incoming : downloaded) {
            if (!latestDate.equals(incoming.getArrivalDate())) {
                continue;
            }

            resolveUnitAndCalculatePricePerKg(incoming);
            SaveResult result = saveOrUpdate(incoming);
            processed++;
            if (result.inserted()) {
                inserted++;
            } else {
                updated++;
            }
        }

        return new SyncResponse(
                "Government price synchronization completed",
                processed,
                inserted,
                updated,
                latestDate);
    }

    private GovernmentPriceResponse fetchPage(int offset, int limit) {
        String apiKey = config.getKey();
        if (apiKey == null || apiKey.isBlank() || apiKey.equalsIgnoreCase("YOUR_API_KEY")) {
            throw new PriceApiException(
                    "Government API key is not configured. Set government.api.key in application.properties.");
        }

        try {
            GovernmentPriceResponse response = governmentRestClient.get()
                    .uri(uriBuilder -> buildGovernmentUri(uriBuilder, apiKey, offset, limit))
                    .header("Accept", "application/json")
                    .retrieve()
                    .body(GovernmentPriceResponse.class);

            if (response == null) {
                throw new PriceApiException(
                        "Government API returned empty response. Check data.gov.in API key, resource ID, and availability.");
            }
            return response;
        } catch (PriceApiException e) {
            throw e;
        } catch (org.springframework.web.client.RestClientResponseException e) {
            String body = e.getResponseBodyAsString();
            String preview = body == null || body.isBlank()
                    ? "<empty>"
                    : (body.length() > 500 ? body.substring(0, 500) : body);
            throw new PriceApiException(
                    "Government API request failed with HTTP " + e.getStatusCode().value()
                            + ": " + preview, e);
        } catch (Exception e) {
            throw new PriceApiException(
                    "Failed to connect to data.gov.in: " + e.getMessage(), e);
        }
    }

    private java.net.URI buildGovernmentUri(UriBuilder uriBuilder, String apiKey, int offset, int limit) {
        return uriBuilder
                .path("/resource/{id}")
                .queryParam("api-key", apiKey)
                .queryParam("format", config.getFormat())
                .queryParam("offset", offset)
                .queryParam("limit", limit)
                .build(config.getResourceId());
    }

    private MarketPrice fromGovernmentRecord(Map<String, Object> record) {
        MarketPrice price = new MarketPrice();
        price.setState(text(record, "state"));
        price.setDistrict(text(record, "district"));
        price.setMarket(text(record, "market"));
        price.setCommodity(text(record, "commodity"));
        price.setVariety(text(record, "variety"));
        price.setGrade(text(record, "grade"));
        price.setArrivalDate(parseDate(text(record, "arrival_date")));
        price.setMinPrice(number(record, "min_price"));
        price.setMaxPrice(number(record, "max_price"));
        price.setModalPrice(number(record, "modal_price"));
        return price;
    }

    private SaveResult saveOrUpdate(MarketPrice incoming) {
        Optional<MarketPrice> existing = repository
                .findByStateAndDistrictAndMarketAndCommodityAndVarietyAndGradeAndArrivalDate(
                        incoming.getState(),
                        incoming.getDistrict(),
                        incoming.getMarket(),
                        incoming.getCommodity(),
                        incoming.getVariety(),
                        incoming.getGrade(),
                        incoming.getArrivalDate());

        boolean inserted = existing.isEmpty();
        MarketPrice target = existing.orElseGet(MarketPrice::new);

        target.setState(incoming.getState());
        target.setDistrict(incoming.getDistrict());
        target.setMarket(incoming.getMarket());
        target.setCommodity(incoming.getCommodity());
        target.setVariety(incoming.getVariety());
        target.setGrade(incoming.getGrade());
        target.setArrivalDate(incoming.getArrivalDate());
        target.setMinPrice(incoming.getMinPrice());
        target.setMaxPrice(incoming.getMaxPrice());
        target.setModalPrice(incoming.getModalPrice());
        target.setSourceUnit(incoming.getSourceUnit());
        target.setKgPerUnit(incoming.getKgPerUnit());
        target.setMinPricePerKg(incoming.getMinPricePerKg());
        target.setMaxPricePerKg(incoming.getMaxPricePerKg());
        target.setModalPricePerKg(incoming.getModalPricePerKg());

        repository.save(target);
        return new SaveResult(inserted);
    }

    /**
     * Lookup hierarchy:
     * 1. commodity + state + district + grade
     * 2. commodity + state + grade
     *
     * Grade A, B and C are always isolated. No grade or state mixing is allowed.
     * At the selected level, only the latest arrival date is used and prices are
     * averaged across all matching market records.
     */
    @Transactional(readOnly = true)
    public CropPriceResponse getCropPrice(PriceSearchRequest request) {
        String commodity = required(request.getCommodity(), "Commodity");
        String state = required(request.getState(), "State");
        String district = normalizeOptional(request.getDistrict());
        String gradeInput = normalizeOptional(request.getGrade());
        String requestedGrade = normalizeRequiredGrade(gradeInput);
        double multiplier = getGradeMultiplier(requestedGrade);

        List<MarketPrice> matches = List.of();
        String matchedDistrict = null;

        if (district != null) {
            matches = latestWithUsableKgPrice(
                    repository.findByCommodityStateAndDistrict(commodity, state, district));
            if (!matches.isEmpty()) {
                matchedDistrict = district;
            }
        }

        if (matches.isEmpty()) {
            matches = latestWithUsableKgPrice(
                    repository.findByCommodityAndState(commodity, state));
        }

        if (matches.isEmpty()) {
            matches = latestWithUsableKgPrice(
                    repository.findByCommodityNormalized(commodity));
        }

        if (matches.isEmpty()) {
            throw new PriceApiException(
                    "No price found for commodity='" + commodity
                            + "', state='" + state
                            + "', district='" + (district == null ? "" : district) + "'");
        }

        return average(matches, commodity, state, matchedDistrict, requestedGrade, multiplier);
    }

    /** Returns latest-day summaries for all crops stored in the database. */
    @Transactional(readOnly = true)
    public List<CropPriceResponse> getAllLatestCropPrices() {
        List<MarketPrice> all = repository.findAll();
        if (all.isEmpty()) {
            return List.of();
        }

        LocalDate latestDate = all.stream()
                .map(MarketPrice::getArrivalDate)
                .filter(java.util.Objects::nonNull)
                .max(LocalDate::compareTo)
                .orElse(null);

        if (latestDate == null) {
            return List.of();
        }

        return all.stream()
                .filter(p -> latestDate.equals(p.getArrivalDate()))
                .map(this::ensureKgPrice)
                .filter(this::hasUsableKgPrice)
                .collect(java.util.stream.Collectors.groupingBy(p -> new GroupKey(
                        normalized(p.getCommodity()),
                        normalized(p.getState()),
                        normalized(p.getDistrict()),
                        normalized(p.getGrade()))))
                .values()
                .stream()
                .map(group -> average(group, group.get(0).getCommodity(), group.get(0).getState(),
                        group.get(0).getDistrict(), group.get(0).getGrade(), 1.0))
                .sorted(Comparator.comparing(CropPriceResponse::getCommodity,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    private CropPriceResponse average(
            List<MarketPrice> prices,
            String requestedCommodity,
            String requestedState,
            String requestedDistrict,
            String requestedGrade,
            double multiplier) {

        double min = prices.stream()
                .map(MarketPrice::getMinPricePerKg)
                .filter(java.util.Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);

        double max = prices.stream()
                .map(MarketPrice::getMaxPricePerKg)
                .filter(java.util.Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);

        MarketPrice first = prices.get(0);
        CropPriceResponse response = new CropPriceResponse();
        response.setCommodity(first.getCommodity() != null ? first.getCommodity() : requestedCommodity);
        response.setState(requestedState != null ? requestedState : first.getState());
        response.setDistrict(requestedDistrict);
        response.setGrade(requestedGrade);
        response.setPriceDate(first.getArrivalDate());
        response.setMinPricePerKg(round(min * multiplier));
        response.setMaxPricePerKg(round(max * multiplier));
        return response;
    }

    private List<MarketPrice> latestWithUsableKgPrice(List<MarketPrice> prices) {
        List<MarketPrice> valid = prices.stream()
                .map(this::ensureKgPrice)
                .filter(this::hasUsableKgPrice)
                .toList();
        if (valid.isEmpty()) {
            return List.of();
        }

        LocalDate latest = valid.stream()
                .map(MarketPrice::getArrivalDate)
                .filter(java.util.Objects::nonNull)
                .max(LocalDate::compareTo)
                .orElse(null);

        if (latest == null) {
            return List.of();
        }

        return valid.stream()
                .filter(p -> latest.equals(p.getArrivalDate()))
                .toList();
    }

    private MarketPrice ensureKgPrice(MarketPrice price) {
        if (price.getKgPerUnit() == null || price.getKgPerUnit() <= 0) {
            price.setKgPerUnit(DEFAULT_KG_PER_UNIT);
            price.setSourceUnit(DEFAULT_SOURCE_UNIT);
        }
        if (price.getMinPricePerKg() == null && price.getMinPrice() != null) {
            price.setMinPricePerKg(price.getMinPrice() / price.getKgPerUnit());
        }
        if (price.getMaxPricePerKg() == null && price.getMaxPrice() != null) {
            price.setMaxPricePerKg(price.getMaxPrice() / price.getKgPerUnit());
        }
        if (price.getModalPricePerKg() == null && price.getModalPrice() != null) {
            price.setModalPricePerKg(price.getModalPrice() / price.getKgPerUnit());
        }
        return price;
    }

    private boolean hasUsableKgPrice(MarketPrice price) {
        return price.getArrivalDate() != null
                && price.getMinPricePerKg() != null
                && price.getMaxPricePerKg() != null;
    }

    /**
     * Unit strategy:
     * - First use an explicit commodity+variety override from commodity_units.
     * - Otherwise use the DMI standard Rs./Quintal convention for this dataset.
     * - One quintal = 100 kg, so Rs./Quintal / 100 = Rs./kg.
     *
     * If a market/commodity is actually reported in another local unit, add an
     * override to commodity_units rather than silently using the wrong conversion.
     */
    private void resolveUnitAndCalculatePricePerKg(MarketPrice price) {
        Optional<CommodityUnit> override = Optional.empty();

        if (price.getCommodity() != null && !price.getCommodity().isBlank()
                && price.getVariety() != null && !price.getVariety().isBlank()) {
            override = unitRepository.findByCommodityIgnoreCaseAndVarietyIgnoreCase(
                    price.getCommodity().trim(), price.getVariety().trim());
        }

        if (override.isPresent() && override.get().getKgPerUnit() != null && override.get().getKgPerUnit() > 0) {
            CommodityUnit unit = override.get();
            price.setSourceUnit(unit.getSourceUnit() != null ? unit.getSourceUnit() : DEFAULT_SOURCE_UNIT);
            price.setKgPerUnit(unit.getKgPerUnit());
        } else {
            price.setSourceUnit(DEFAULT_SOURCE_UNIT);
            price.setKgPerUnit(DEFAULT_KG_PER_UNIT);
        }

        calculatePricePerKg(price);
    }

    private void calculatePricePerKg(MarketPrice price) {
        Double kgPerUnit = price.getKgPerUnit();
        if (kgPerUnit == null || kgPerUnit <= 0) {
            price.setMinPricePerKg(null);
            price.setMaxPricePerKg(null);
            price.setModalPricePerKg(null);
            return;
        }

        price.setMinPricePerKg(divide(price.getMinPrice(), kgPerUnit));
        price.setMaxPricePerKg(divide(price.getMaxPrice(), kgPerUnit));
        price.setModalPricePerKg(divide(price.getModalPrice(), kgPerUnit));
    }

    private Double divide(Double value, double divisor) {
        return value == null ? null : value / divisor;
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        for (DateTimeFormatter formatter : List.of(
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("dd-MM-yyyy"),
                DateTimeFormatter.ISO_LOCAL_DATE)) {
            try {
                return LocalDate.parse(value.trim(), formatter);
            } catch (Exception ignored) {
                // Try the next supported format.
            }
        }
        return null;
    }

    private String text(Map<String, Object> record, String key) {
        Object value = record.get(key);
        return value == null ? null : value.toString().trim();
    }

    private Double number(Map<String, Object> record, String key) {
        String value = text(record, key);
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Double.parseDouble(value.replace(",", ""));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void validateGovernmentConfig() {
        if (isPlaceholder(config.getKey())) {
            throw new PriceApiException("Set government.api.key in application.properties");
        }
        if (isPlaceholder(config.getResourceId())) {
            throw new PriceApiException("Set government.api.resource-id in application.properties");
        }
    }

    private boolean isPlaceholder(String value) {
        return value == null || value.isBlank() || value.startsWith("YOUR_");
    }

    private String required(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
        return value.trim();
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeRequiredGrade(String value) {
        if (value == null || value.isBlank()) {
            return "A";
        }
        String grade = value.trim().toUpperCase();
        if (grade.equals("B") || grade.contains("GRADE B")) {
            return "B";
        }
        if (grade.equals("C") || grade.contains("GRADE C")) {
            return "C";
        }
        return "A";
    }

    private double getGradeMultiplier(String grade) {
        if ("B".equalsIgnoreCase(grade)) {
            return 0.90; // 10% discount for Grade B
        } else if ("C".equalsIgnoreCase(grade)) {
            return 0.80; // 20% discount for Grade C
        }
        return 1.00; // Actual price for Grade A (or default)
    }

    private String normalized(String value) {
        return value == null ? null : value.trim().toLowerCase().replace(" ", "");
    }

    private double round(double value) {
        return (double) Math.round(value);
    }

    private record SaveResult(boolean inserted) {}
    private record GroupKey(String commodity, String state, String district, String grade) {}
}
