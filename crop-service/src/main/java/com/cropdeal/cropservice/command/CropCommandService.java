package com.cropdeal.cropservice.command;

import com.cropdeal.cropservice.client.PriceAlertClient;
import com.cropdeal.cropservice.client.PriceServiceClient;
import com.cropdeal.cropservice.dto.CropCreateRequest;
import com.cropdeal.cropservice.dto.CropResponse;
import com.cropdeal.cropservice.dto.CropUpdateRequest;
import com.cropdeal.cropservice.dto.PriceRangeResponse;
import com.cropdeal.cropservice.dto.PriceSearchRequest;
import com.cropdeal.cropservice.entity.Crop;
import com.cropdeal.cropservice.exception.CropNotFoundException;
import com.cropdeal.cropservice.exception.InsufficientQuantityException;
import com.cropdeal.cropservice.exception.InvalidCropPriceException;
import com.cropdeal.cropservice.repository.CropRepository;
import com.cropdeal.cropservice.service.SubscriptionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * CQRS Command Service for Crop write operations (create, update, delete, stock reduction).
 */
@Service
@Transactional
public class CropCommandService {

    private final CropRepository cropRepository;
    private final PriceServiceClient priceServiceClient;
    private final SubscriptionService subscriptionService;
    private final PriceAlertClient priceAlertClient;

    public CropCommandService(CropRepository cropRepository,
                              PriceServiceClient priceServiceClient,
                              SubscriptionService subscriptionService,
                              PriceAlertClient priceAlertClient) {
        this.cropRepository = cropRepository;
        this.priceServiceClient = priceServiceClient;
        this.subscriptionService = subscriptionService;
        this.priceAlertClient = priceAlertClient;
    }

    public CropResponse create(CropCreateRequest request) {
        validateUnit(request.getUnit());
        PriceRangeResponse mandi = getMandiPrice(request.getCommodity(), request.getState(), request.getDistrict(), request.getGrade());
        validateFarmerPrice(request.getPricePerKg(), mandi.maxPricePerKg());

        Crop crop = new Crop();
        crop.setFarmerId(request.getFarmerId());
        apply(crop, request.getCommodity(), request.getState(), request.getDistrict(), request.getGrade(),
                request.getQuantity(), request.getUnit(), request.getPricePerKg(), request.getDescription(),
                request.getFarmerName(), request.getImageUrl());
        crop.setStatus(Crop.PUBLISHED);

        Crop saved = cropRepository.save(crop);
        subscriptionService.notifyMatchingSubscribers(saved);
        if (priceAlertClient != null) {
            priceAlertClient.triggerPriceAlertMatch(
                    saved.getId(),
                    saved.getFarmerId(),
                    saved.getCommodity(),
                    saved.getPricePerKg(),
                    saved.getQuantity() != null ? saved.getQuantity().doubleValue() : null,
                    saved.getUnit(),
                    saved.getDistrict(),
                    saved.getState()
            );
        }
        return toResponse(saved);
    }

    public CropResponse update(Long id, CropUpdateRequest request) {
        Crop crop = getEntity(id);
        if (Crop.SOLD_OUT.equals(crop.getStatus())) {
            throw new IllegalArgumentException("Sold-out crop cannot be updated. Publish a new crop instead");
        }

        validateUnit(request.getUnit());
        PriceRangeResponse mandi = getMandiPrice(request.getCommodity(), request.getState(), request.getDistrict(), request.getGrade());
        validateFarmerPrice(request.getPricePerKg(), mandi.maxPricePerKg());

        apply(crop, request.getCommodity(), request.getState(), request.getDistrict(), request.getGrade(),
                request.getQuantity(), request.getUnit(), request.getPricePerKg(), request.getDescription(),
                crop.getFarmerName(), crop.getImageUrl());
        crop.setStatus(Crop.PUBLISHED);
        Crop saved = cropRepository.save(crop);
        subscriptionService.notifyMatchingSubscribers(saved);
        return toResponse(saved);
    }

    public void delete(Long id) {
        Crop crop = getEntity(id);
        crop.setStatus(Crop.DELETED);
        cropRepository.save(crop);
    }

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

    private Crop getEntity(Long id) {
        return cropRepository.findById(id)
                .orElseThrow(() -> new CropNotFoundException("Crop not found with id: " + id));
    }

    private PriceRangeResponse getMandiPrice(String commodity, String state, String district, String grade) {
        try {
            return priceServiceClient.getCurrentPrice(
                    new PriceSearchRequest(commodity.trim(), state.trim(), district.trim(), grade.trim().toUpperCase()));
        } catch (Exception ex) {
            return new PriceRangeResponse(commodity, state, district, grade, java.time.LocalDate.now(), new BigDecimal("10.00"), new BigDecimal("300.00"));
        }
    }

    private void validateFarmerPrice(BigDecimal farmerPrice, BigDecimal maxPrice) {
        if (farmerPrice == null || farmerPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidCropPriceException("Price must be greater than 0");
        }
        if (farmerPrice.compareTo(maxPrice) > 0) {
            throw new InvalidCropPriceException(
                    "Farmer price exceeds mandi ceiling rate of Rs " + maxPrice + " / KG");
        }
    }

    private void validateUnit(String unit) {
        if (unit == null || !unit.trim().equalsIgnoreCase("KG")) {
            throw new IllegalArgumentException("Crop listing unit must be KG");
        }
    }

    private void apply(Crop crop, String commodity, String state, String district, String grade,
                       BigDecimal quantity, String unit, BigDecimal pricePerKg, String description,
                       String farmerName, String imageUrl) {
        crop.setCommodity(commodity.trim());
        crop.setState(state.trim());
        crop.setDistrict(district.trim());
        crop.setGrade(grade.trim().toUpperCase());
        crop.setQuantity(quantity.setScale(2, RoundingMode.HALF_UP));
        crop.setUnit(unit.trim().toUpperCase());
        crop.setPricePerKg(pricePerKg.setScale(2, RoundingMode.HALF_UP));
        crop.setDescription(description != null ? description.trim() : null);
        crop.setFarmerName(farmerName != null ? farmerName.trim() : null);
        crop.setImageUrl(imageUrl != null ? imageUrl.trim() : null);
    }

    private String formatQuantity(BigDecimal qty) {
        if (qty == null) return "0";
        return qty.stripTrailingZeros().toPlainString();
    }

    private CropResponse toResponse(Crop c) {
        String loc = (c.getDistrict() != null ? c.getDistrict() : "") +
                (c.getState() != null ? (c.getDistrict() != null ? ", " : "") + c.getState() : "");
        String fName = c.getFarmerName() != null ? c.getFarmerName() : ("Farmer #" + c.getFarmerId());
        String img = c.getImageUrl();
        return new CropResponse(
                c.getId(),
                c.getFarmerId(),
                fName,
                c.getCommodity(),
                c.getCommodity(),
                c.getState(),
                c.getDistrict(),
                loc,
                c.getGrade(),
                c.getQuantity(),
                c.getQuantity(),
                c.getUnit(),
                c.getPricePerKg(),
                c.getPricePerKg(),
                c.getDescription(),
                img,
                c.getStatus(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
