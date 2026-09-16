package com.example.demo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record NegotiationCreateRequest(
        @NotNull Long cropId,
        @NotNull Long buyerId,
        @NotNull Long sellerId,
        @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal quantity,
        @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal targetPrice
) {
}
