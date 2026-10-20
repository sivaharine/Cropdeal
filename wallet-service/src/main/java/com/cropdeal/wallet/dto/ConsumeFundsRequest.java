package com.cropdeal.wallet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ConsumeFundsRequest(
    @NotNull Long userId,
    @NotBlank String referenceId,
    Long payeeUserId,
    String cropName
) {
    public ConsumeFundsRequest(Long userId, String referenceId) {
        this(userId, referenceId, null, null);
    }
}