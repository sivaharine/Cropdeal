package com.cropdeal.wallet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ReleaseFundsRequest(
    @NotNull Long userId,
    @NotBlank String referenceId
) {}