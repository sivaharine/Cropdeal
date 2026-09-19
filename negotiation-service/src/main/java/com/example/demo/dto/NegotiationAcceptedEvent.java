package com.example.demo.dto;

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
