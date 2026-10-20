package com.example.notification.dto;

import java.math.BigDecimal;

public record PaymentCompletedEvent(
        Long paymentId,
        Long orderId,
        Long dealerId,
        Long farmerId,
        BigDecimal amount,
        String paymentMethod,
        String transactionReference
) {
}
