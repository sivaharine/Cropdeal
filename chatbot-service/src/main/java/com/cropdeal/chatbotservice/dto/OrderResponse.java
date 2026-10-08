package com.cropdeal.chatbotservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderResponse(
        Long id,
        Long farmerId,
        Long dealerId,
        Long cropId,
        String cropName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalAmount,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
