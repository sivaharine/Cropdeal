package com.cropdeal.wallet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ConsumeFundsRequest(
    @NotNull Long userId,
    @NotBlank String referenceId
) {}