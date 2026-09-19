package com.example.demo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record OfferRequest(
        @NotNull Long offeredByUserId,
        @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal amount,
        @Size(max = 500) String message
) {
}
