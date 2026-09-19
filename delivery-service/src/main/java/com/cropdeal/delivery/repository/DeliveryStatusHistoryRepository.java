package com.cropdeal.delivery.repository;

import com.cropdeal.delivery.entity.DeliveryStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeliveryStatusHistoryRepository
        extends JpaRepository<DeliveryStatusHistory, Long> {

    // Get status history of a delivery
    List<DeliveryStatusHistory>
    findByDeliveryIdOrderByChangedAtDesc(
            Long deliveryId
    );
}