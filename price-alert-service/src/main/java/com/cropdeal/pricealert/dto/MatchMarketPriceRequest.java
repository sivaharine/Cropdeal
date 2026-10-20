package com.cropdeal.pricealert.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchMarketPriceRequest {

    @NotNull(message = "Price ID is required")
    private Long priceId;

    @NotBlank(message = "Crop name is required")
    private String cropName;

    @NotNull(message = "Market price is required")
    @DecimalMin(value = "0.01", message = "Market price must be greater than 0")
    private BigDecimal marketPrice;

    private String marketName;
    private String district;
    private String state;
    private String unit;
}
