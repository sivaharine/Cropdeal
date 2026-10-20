package com.cropdeal.pricealert.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBuyingRequest {

    @NotNull(message = "Dealer ID is required")
    private Long dealerId;

    private String dealerName;

    @NotBlank(message = "Crop name is required")
    private String cropName;

    @NotNull(message = "Offered price is required")
    @DecimalMin(value = "0.01", message = "Offered price must be greater than 0")
    private BigDecimal offeredPrice;

    @NotNull(message = "Quantity required is required")
    @Positive(message = "Quantity must be positive")
    private Double quantityRequired;

    @Builder.Default
    private String unit = "kg";

    private String district;
    private String state;
    private String description;
}
