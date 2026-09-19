package com.example.demo.dto;

import com.example.demo.entity.NegotiationStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record NegotiationResponse(
        Long id,
        Long cropId,
        Long buyerId,
        Long sellerId,
        BigDecimal quantity,
        BigDecimal targetPrice,
        NegotiationStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<OfferResponse> offers
) {
}
