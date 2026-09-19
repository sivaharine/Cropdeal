package com.example.notification.dto;

import java.math.BigDecimal;

public record NegotiationAcceptedEvent(
        Long negotiationId,
        Long offerId,
        Long dealerId,
        Long farmerId,
        BigDecimal acceptedAmount,
        String message
) {
}
