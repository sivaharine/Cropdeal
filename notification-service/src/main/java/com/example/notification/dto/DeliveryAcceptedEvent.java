package com.example.notification.dto;

import java.time.LocalDateTime;

public record DeliveryAcceptedEvent(
        Long deliveryId,
        Long orderId,
        Long farmerId,
        Long dealerId,
        Long deliveryPartnerId,
        String partnerName,
        String deliveryReference,
        String pickupAddress,
        String deliveryAddress,
        LocalDateTime acceptedAt
) {
}
