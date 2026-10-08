package com.cropdeal.wallet.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreditWalletRequest(
    @NotNull Long userId,
    @NotNull @DecimalMin("1.00") BigDecimal amount,
    String description
) {}