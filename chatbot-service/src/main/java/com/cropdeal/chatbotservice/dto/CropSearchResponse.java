package com.cropdeal.chatbotservice.dto;

import java.math.BigDecimal;

public record CropSearchResponse(
        Long id,
        String commodity,
        String state,
        String district,
        String grade,
        BigDecimal quantity,
        String unit,
        BigDecimal pricePerKg,
        String status
) {
}
