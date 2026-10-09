package com.cropdeal.pricealert.dto;

import com.cropdeal.pricealert.enums.PriceCondition;
import com.cropdeal.pricealert.enums.UserRole;
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
public class CreateSubscriptionRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "User role is required (FARMER or DEALER)")
    private UserRole userRole;

    @NotBlank(message = "Crop name is required")
    private String cropName;

    @NotNull(message = "Target price is required")
    @DecimalMin(value = "0.01", message = "Target price must be greater than 0")
    private BigDecimal targetPrice;

    @NotNull(message = "Price condition is required")
    private PriceCondition priceCondition;

    private String district;
    private String state;

    @Builder.Default
    private String unit = "kg";
}
