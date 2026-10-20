package com.cropdeal.user.dto;

import java.time.LocalDateTime;

public record FarmerReviewResponse(
    Long id,
    Long farmerId,
    Long dealerId,
    Long orderId,
    Integer rating,
    String comment,
    LocalDateTime createdAt
) {}