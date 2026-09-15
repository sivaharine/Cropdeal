package com.cropdeal.priceservice.service;

import com.cropdeal.priceservice.config.GovernmentApiConfig;
import com.cropdeal.priceservice.dto.DistrictPriceResponse;
import com.cropdeal.priceservice.exception.PriceApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PriceService {

    private static final Logger log = LoggerFactory.getLogger(PriceService.class);

    private static final int PAGE_SIZE = 10000;

    /*
     * Government API prices are in ₹ per Quintal.
     * 1 Quintal = 100 KG.
     */
    private static final double KG_PER_QUINTAL = 100.0;

    private final GovernmentApiConfig governmentApiConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    public PriceService(GovernmentApiConfig governmentApiConfig) {
        this.governmentApiConfig = governmentApiConfig;
    }

    // ============================================================
    // MAIN PUBLIC METHOD
    //
    // Cascading search strategy:
    //   1. commodity + state + district
    //   2. commodity + state (if district found nothing)
    //   3. commodity only (if state also found nothing)
    //
    // All matching is case-insensitive and space-insensitive.
    // ============================================================

    public List<DistrictPriceResponse> getCropPrices(
            String commodity,
            String state,
            String district) {

        /*
         * Fetch all records for the commodity from the government API.
         * We fetch broadly and filter on the client side so that
         * case and space differences are handled properly.
         * (e.g., "TamilNadu" vs "Tamil Nadu" vs "tamilnadu")
         */
        String jsonResponse = fetchFromGovernmentApi(commodity);

        List<RawRecord> allRecords = parseRecords(jsonResponse);

        if (allRecords.isEmpty()) {
            return List.of();
        }

        // ========================================================
        // STEP 1: Try commodity + state + district
        // ========================================================

        if (hasValue(state) && hasValue(district)) {

            List<RawRecord> filtered = allRecords.stream()
                    .filter(r -> normalize(r.state())
                            .equals(normalize(state)))
                    .filter(r -> normalize(r.district())
                            .equals(normalize(district)))
                    .toList();

            if (!filtered.isEmpty()) {

                log.info("Found {} records matching commodity + state + district",
                        filtered.size());

                return groupByDistrictAndAverage(filtered);
            }

            log.info("No records found for district '{}'. " +
                    "Falling back to state level.", district);
        }

        // ========================================================
        // STEP 2: Try commodity + state
        // ========================================================

        if (hasValue(state)) {

            List<RawRecord> filtered = allRecords.stream()
                    .filter(r -> normalize(r.state())
                            .equals(normalize(state)))
                    .toList();

            if (!filtered.isEmpty()) {

                log.info("Found {} records matching commodity + state",
                        filtered.size());

                return groupByDistrictAndAverage(filtered);
            }

            log.info("No records found for state '{}'. " +
                    "Falling back to commodity only.", state);
        }

        // ========================================================
        // STEP 3: Commodity only (return all districts)
        // ========================================================

        log.info("Returning all {} records for commodity", allRecords.size());

        return groupByDistrictAndAverage(allRecords);
    }

    // ============================================================
    // NORMALIZE STRING
    // Removes all spaces and converts to lowercase.
    // "Tamil Nadu" → "tamilnadu"
    // "TamilNadu"  → "tamilnadu"
    // ============================================================

    private String normalize(String value) {

        if (value == null) {
            return "";
        }

        return value.replaceAll("\\s+", "").toLowerCase();
    }

    // ============================================================
    // CHECK IF VALUE IS PRESENT
    // ============================================================

    private boolean hasValue(String value) {
        return value != null && !value.isBlank();
    }

    // ============================================================
    // FETCH DATA FROM GOVERNMENT API
    // Only filters by commodity on the server side.
    // State and district filtering is done client-side
    // for case/space normalization.
    // ============================================================

    private String fetchFromGovernmentApi(String commodity) {

        try {

            StringBuilder url = new StringBuilder();

            url.append(governmentApiConfig.getBaseUrl())
               .append("/resource/")
               .append(governmentApiConfig.getResourceId())
               .append("?api-key=").append(encode(governmentApiConfig.getApiKey()))
               .append("&format=").append(encode(governmentApiConfig.getFormat()))
               .append("&limit=").append(PAGE_SIZE);

            if (hasValue(commodity)) {
                url.append("&filters[commodity]=")
                   .append(encode(commodity.trim()));
            }

            log.info("Calling Government API: {}", url);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url.toString()))
                    .timeout(Duration.ofSeconds(120))
                    .GET()
                    .build();

            HttpResponse<String> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new PriceApiException(
                        "Government API returned HTTP " + response.statusCode()
                                + ": " + response.body()
                );
            }

            log.info("Government API response received. Length: {} chars",
                    response.body().length());

            return response.body();

        } catch (PriceApiException exception) {
            throw exception;

        } catch (Exception exception) {
            throw new PriceApiException(
                    "Failed to connect to government API: "
                            + exception.getMessage(),
                    exception
            );
        }
    }

    // ============================================================
    // URL ENCODE HELPER
    // ============================================================

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    // ============================================================
    // PARSE JSON RESPONSE INTO RAW RECORDS
    // ============================================================

    private List<RawRecord> parseRecords(String jsonResponse) {

        List<RawRecord> records = new ArrayList<>();

        if (jsonResponse == null || jsonResponse.isBlank()) {
            log.warn("Government API returned empty response");
            return records;
        }

        try {

            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode recordsNode = root.path("records");

            if (!recordsNode.isArray() || recordsNode.isEmpty()) {
                log.info("No records found in government API response");
                return records;
            }

            for (JsonNode node : recordsNode) {

                RawRecord record = parseOneRecord(node);

                if (record != null) {
                    records.add(record);
                }
            }

            log.info("Parsed {} valid records from government API",
                    records.size());

        } catch (Exception exception) {
            log.error("JSON parsing failed: {}", exception.getMessage(), exception);
            throw new PriceApiException(
                    "Failed to parse government API response: "
                            + exception.getMessage(),
                    exception
            );
        }

        return records;
    }

    // ============================================================
    // PARSE A SINGLE JSON RECORD
    // ============================================================

    private RawRecord parseOneRecord(JsonNode node) {

        try {

            String commodity = getText(node, "commodity");
            String state = getText(node, "state");
            String district = getText(node, "district");

            Double minPrice = getDouble(node, "min_price");
            Double maxPrice = getDouble(node, "max_price");

            if (commodity == null || commodity.isBlank()) {
                return null;
            }

            if (state == null || state.isBlank()) {
                return null;
            }

            if (district == null || district.isBlank()) {
                return null;
            }

            /*
             * Convert from ₹ per Quintal to ₹ per KG.
             */
            Double minPricePerKg = (minPrice != null)
                    ? minPrice / KG_PER_QUINTAL
                    : null;

            Double maxPricePerKg = (maxPrice != null)
                    ? maxPrice / KG_PER_QUINTAL
                    : null;

            return new RawRecord(
                    commodity.trim(),
                    state.trim(),
                    district.trim(),
                    minPricePerKg,
                    maxPricePerKg
            );

        } catch (Exception exception) {
            log.warn("Skipping invalid record: {}", exception.getMessage());
            return null;
        }
    }

    // ============================================================
    // GROUP BY (STATE, DISTRICT, COMMODITY) AND AVERAGE
    // ============================================================

    private List<DistrictPriceResponse> groupByDistrictAndAverage(
            List<RawRecord> records) {

        /*
         * Key = normalized "state|district|commodity"
         * Value = list of records for that group
         */
        Map<String, List<RawRecord>> grouped = new HashMap<>();

        for (RawRecord record : records) {

            String key = normalize(record.state())
                    + "|" + normalize(record.district())
                    + "|" + normalize(record.commodity());

            grouped.computeIfAbsent(key, k -> new ArrayList<>())
                    .add(record);
        }

        List<DistrictPriceResponse> result = new ArrayList<>();

        for (List<RawRecord> group : grouped.values()) {

            RawRecord first = group.get(0);

            /*
             * Calculate average min price per kg
             */
            double avgMinPrice = group.stream()
                    .filter(r -> r.minPricePerKg() != null)
                    .mapToDouble(RawRecord::minPricePerKg)
                    .average()
                    .orElse(0.0);

            /*
             * Calculate average max price per kg
             */
            double avgMaxPrice = group.stream()
                    .filter(r -> r.maxPricePerKg() != null)
                    .mapToDouble(RawRecord::maxPricePerKg)
                    .average()
                    .orElse(0.0);

            DistrictPriceResponse response = new DistrictPriceResponse();

            response.setCommodity(first.commodity());
            response.setState(first.state());
            response.setDistrict(first.district());
            response.setMinPricePerKg(roundToTwoDecimals(avgMinPrice));
            response.setMaxPricePerKg(roundToTwoDecimals(avgMaxPrice));

            result.add(response);
        }

        return result;
    }

    // ============================================================
    // HELPER: Extract text from JSON node
    // ============================================================

    private String getText(JsonNode node, String fieldName) {

        JsonNode value = node.get(fieldName);

        if (value == null || value.isNull()) {
            return null;
        }

        return value.asText();
    }

    // ============================================================
    // HELPER: Extract double from JSON node
    // ============================================================

    private Double getDouble(JsonNode node, String fieldName) {

        JsonNode value = node.get(fieldName);

        if (value == null || value.isNull()) {
            return null;
        }

        if (value.isNumber()) {
            return value.asDouble();
        }

        String text = value.asText();
        if (text == null || text.isBlank()) {
            return null;
        }

        try {
            return Double.parseDouble(text.trim());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    // ============================================================
    // HELPER: Round to 2 decimal places
    // ============================================================

    private double roundToTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    // ============================================================
    // INTERNAL RECORD: Holds parsed data before grouping
    // ============================================================

    private record RawRecord(
            String commodity,
            String state,
            String district,
            Double minPricePerKg,
            Double maxPricePerKg
    ) {}
}