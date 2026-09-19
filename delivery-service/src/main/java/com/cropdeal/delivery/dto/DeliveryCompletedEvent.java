package com.cropdeal.delivery.dto;

import java.time.LocalDateTime;

public record DeliveryCompletedEvent(
        Long deliveryId,
        Long orderId,
        Long farmerId,
        Long dealerId,
        Long deliveryPartnerId,
        String partnerName,
        String deliveryReference,
        LocalDateTime completedAt
) {
}
