package com.cropdeal.pricealert.dto;

import com.cropdeal.pricealert.entity.DealerBuyingRequest;
import com.cropdeal.pricealert.enums.BuyingRequestStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuyingRequestResponse {

    private Long id;
    private Long dealerId;
    private String dealerName;
    private String cropName;
    private BigDecimal offeredPrice;
    private Double quantityRequired;
    private String unit;
    private String district;
    private String state;
    private String description;
    private BuyingRequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BuyingRequestResponse fromEntity(DealerBuyingRequest entity) {
        if (entity == null) return null;
        return BuyingRequestResponse.builder()
                .id(entity.getId())
                .dealerId(entity.getDealerId())
                .dealerName(entity.getDealerName())
                .cropName(entity.getCropName())
                .offeredPrice(entity.getOfferedPrice())
                .quantityRequired(entity.getQuantityRequired())
                .unit(entity.getUnit())
                .district(entity.getDistrict())
                .state(entity.getState())
                .description(entity.getDescription())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
