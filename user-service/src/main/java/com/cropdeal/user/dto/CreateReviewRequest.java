package com.cropdeal.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReviewRequest(
    @NotNull Long farmerId,
    @NotNull Long dealerId,
    @NotNull Long orderId,
    @NotNull @Min(1) @Max(5) Integer rating,
    @Size(max = 1000) String comment
) {}