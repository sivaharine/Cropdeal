package com.cropdeal.cropservice.service;

import com.cropdeal.cropservice.client.PriceServiceClient;
import com.cropdeal.cropservice.dto.*;
import com.cropdeal.cropservice.entity.Crop;
import com.cropdeal.cropservice.exception.CropNotFoundException;
import com.cropdeal.cropservice.exception.InsufficientQuantityException;
import com.cropdeal.cropservice.exception.InvalidCropPriceException;
import com.cropdeal.cropservice.repository.CropRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class CropService {
    private final CropRepository cropRepository;
    private final PriceServiceClient priceServiceClient;
    private final SubscriptionService subscriptionService;

    public CropService(CropRepository cropRepository,
                       PriceServiceClient priceServiceClient,
                       SubscriptionService subscriptionService) {
        this.cropRepository = cropRepository;
        this.priceServiceClient = priceServiceClient;
        this.subscriptionService = subscriptionService;
    }

    @Transactional
    public CropResponse create(CropCreateRequest request) {
        validateUnit(request.getUnit());
        PriceRangeResponse mandi = getMandiPrice(request.getCommodity(), request.getState(), request.getDistrict(), request.getGrade());
        validateFarmerPrice(request.getPricePerKg(), mandi.maxPricePerKg());

        Crop crop = new Crop();
        crop.setFarmerId(request.getFarmerId());
        apply(crop, request.getCommodity(), request.getState(), request.getDistrict(), request.getGrade(),
                request.getQuantity(), request.getUnit(), request.getPricePerKg(), request.getDescription());
        crop.setStatus(Crop.PUBLISHED);

        Crop saved = cropRepository.save(crop);
        subscriptionService.notifyMatchingSubscribers(saved);
        return toResponse(saved);
    }

    @Transactional
    public CropResponse update(Long id, CropUpdateRequest request) {
        Crop crop = getEntity(id);
        if (Crop.SOLD_OUT.equals(crop.getStatus())) {
            throw new IllegalArgumentException("Sold-out crop cannot be updated. Publish a new crop instead");
        }

        validateUnit(request.getUnit());
        PriceRangeResponse mandi = getMandiPrice(request.getCommodity(), request.getState(), request.getDistrict(), request.getGrade());
        validateFarmerPrice(request.getPricePerKg(), mandi.maxPricePerKg());

        apply(crop, request.getCommodity(), request.getState(), request.getDistrict(), request.getGrade(),
                request.getQuantity(), request.getUnit(), request.getPricePerKg(), request.getDescription());
        crop.setStatus(Crop.PUBLISHED);
        Crop saved = cropRepository.save(crop);
        subscriptionService.notifyMatchingSubscribers(saved);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public CropResponse getById(Long id) {
        return toResponse(getEntity(id));
    }

    @Transactional(readOnly = true)
    public List<CropResponse> getByFarmer(Long farmerId) {
        List<CropResponse> result = cropRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId)
                .stream().map(this::toResponse).toList();
        if (result.isEmpty()) {
            throw new CropNotFoundException("No crops found for farmer: " + farmerId);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<CropSearchResponse> search(String commodity, String state, String district, String grade) {
        String normalizedGrade = blankToNull(grade);
        if (normalizedGrade != null) {
            normalizedGrade = normalizedGrade.toUpperCase();
            if (!normalizedGrade.matches("A|B|C")) {
                throw new IllegalArgumentException("Grade must be A, B or C");
            }
        }

        List<CropSearchResponse> result = cropRepository.searchAvailable(
                        blankToNull(commodity), blankToNull(state), blankToNull(district), normalizedGrade)
                .stream().map(this::toSearchResponse).toList();

        if (result.isEmpty()) {
            throw new CropNotFoundException("No available crops found for the given search criteria");
        }
        return result;
    }

    @Transactional
    public void delete(Long id) {
        cropRepository.delete(getEntity(id));
    }

    /**
     * Called by an Order/Deal Service after a dealer purchase is successfully confirmed.
     * The database update is conditional, so two simultaneous purchases cannot reduce
     * the quantity below zero.
     */
    @Transactional
    public CropResponse reduceQuantity(Long cropId, BigDecimal purchasedQuantity) {
        if (purchasedQuantity == null || purchasedQuantity.signum() <= 0) {
            throw new IllegalArgumentException("Purchased quantity must be greater than zero");
        }

        int updated = cropRepository.reduceQuantity(cropId, purchasedQuantity);
        if (updated == 1) {
            return toResponse(getEntity(cropId));
        }

        Crop crop = getEntity(cropId);
        if (!Crop.PUBLISHED.equals(crop.getStatus()) || crop.getQuantity().signum() <= 0) {
            throw new InsufficientQuantityException("Crop is sold out. Available quantity: 0 KG");
        }
        throw new InsufficientQuantityException(
                "Insufficient crop quantity. Available quantity: " + formatQuantity(crop.getQuantity()) + " KG");
    }

    private PriceRangeResponse getMandiPrice(String commodity, String state, String district, String grade) {
        return priceServiceClient.getCurrentPrice(
                new PriceSearchRequest(commodity.trim(), state.trim(), district.trim(), grade.trim().toUpperCase()));
    }

    private void validateFarmerPrice(BigDecimal farmerPrice, BigDecimal mandiMax) {
        if (mandiMax == null || mandiMax.signum() <= 0) {
            throw new InvalidCropPriceException("Current mandi price is not valid");
        }
        if (farmerPrice.compareTo(mandiMax) > 0) {
            throw new InvalidCropPriceException(
                    "Price per kg cannot be greater than the current mandi price of ₹" + money(mandiMax) + "/kg");
        }
    }

    private String money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String formatQuantity(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString();
    }

    private void validateUnit(String unit) {
        if (unit == null || !"KG".equalsIgnoreCase(unit.trim())) {
            throw new IllegalArgumentException("Crop unit must be KG because pricePerKg is used");
        }
    }

    private void apply(Crop c, String commodity, String state, String district, String grade,
                       BigDecimal quantity, String unit, BigDecimal price, String description) {
        c.setCommodity(commodity.trim());
        c.setState(state.trim());
        c.setDistrict(district.trim());
        c.setGrade(grade.trim().toUpperCase());
        c.setQuantity(quantity.setScale(3, RoundingMode.HALF_UP));
        c.setUnit(unit.trim().toUpperCase());
        c.setPricePerKg(price.setScale(2, RoundingMode.HALF_UP));
        c.setDescription(description == null || description.isBlank() ? null : description.trim());
    }

    private Crop getEntity(Long id) {
        return cropRepository.findById(id)
                .orElseThrow(() -> new CropNotFoundException("Crop not found with id: " + id));
    }

    private String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private CropResponse toResponse(Crop c) {
        return new CropResponse(c.getId(), c.getFarmerId(), c.getCommodity(), c.getState(), c.getDistrict(),
                c.getGrade(), c.getQuantity(), c.getUnit(), c.getPricePerKg(), c.getDescription(),
                c.getStatus(), c.getCreatedAt(), c.getUpdatedAt());
    }

    private CropSearchResponse toSearchResponse(Crop c) {
        return new CropSearchResponse(c.getId(), c.getCommodity(), c.getState(), c.getDistrict(),
                c.getGrade(), c.getQuantity(), c.getUnit(), c.getPricePerKg(), c.getStatus());
    }
}
