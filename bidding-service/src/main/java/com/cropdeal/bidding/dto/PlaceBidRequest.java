package com.cropdeal.bidding.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PlaceBidRequest(
    @NotNull Long dealerId,
    @NotNull @DecimalMin("1.00") BigDecimal bidAmount
) {}