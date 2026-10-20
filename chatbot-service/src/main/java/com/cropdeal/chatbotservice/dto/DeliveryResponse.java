package com.cropdeal.chatbotservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DeliveryResponse(
        Long id,
        String deliveryReference,
        Long orderId,
        String deliveryOption,
        Long deliveryPartnerId,
        BigDecimal deliveryCharge,
        String currency,
        String status,
        String customerPhone,
        String pickupAddress,
        String deliveryAddress,
        String deliveryOtp,
        boolean otpVerified,
        String receiptId,
        LocalDateTime acceptedAt,
        String acceptedBy,
        LocalDateTime startedAt,
        LocalDateTime completedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
