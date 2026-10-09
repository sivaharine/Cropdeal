package com.example.demo.dto;

import com.example.demo.entity.OfferStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OfferResponse(
        Long id,
        Long negotiationId,
        Long offeredByUserId,
        BigDecimal amount,
        String message,
        OfferStatus status,
        LocalDateTime createdAt
) {
}
