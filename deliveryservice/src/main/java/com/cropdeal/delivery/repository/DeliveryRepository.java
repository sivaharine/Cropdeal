package com.cropdeal.delivery.repository;

import com.cropdeal.delivery.entity.Delivery;
import com.cropdeal.delivery.entity.DeliveryStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliveryRepository
        extends JpaRepository<Delivery, Long> {

    // Find delivery using order ID
    Optional<Delivery> findByOrderId(Long orderId);

    // Find all deliveries assigned to an agent
    List<Delivery> findByDeliveryAgentId(
            Long deliveryAgentId
    );

    // Find agent's active delivery
    Optional<Delivery>
    findFirstByDeliveryAgentIdAndStatusIn(
            Long deliveryAgentId,
            List<DeliveryStatus> statuses
    );
}