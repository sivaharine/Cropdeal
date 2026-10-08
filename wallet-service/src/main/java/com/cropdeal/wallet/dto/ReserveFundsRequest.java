package com.cropdeal.wallet.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ReserveFundsRequest(
    @NotNull Long userId,
    @NotBlank String referenceId,
    @NotNull @DecimalMin("1.00") BigDecimal amount
) {}