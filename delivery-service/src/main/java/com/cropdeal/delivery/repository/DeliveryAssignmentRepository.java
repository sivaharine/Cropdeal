package com.cropdeal.delivery.repository;

import com.cropdeal.delivery.entity.DeliveryAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface DeliveryAssignmentRepository
        extends JpaRepository<DeliveryAssignment, Long> {

    // Find assignment for particular delivery and agent
    Optional<DeliveryAssignment>
    findByDeliveryIdAndDeliveryAgentId(
            Long deliveryId,
            Long deliveryAgentId
    );

    // Find all assignments of an agent
    List<DeliveryAssignment>
    findByDeliveryAgentId(Long deliveryAgentId);

    // Find assignments for a delivery
    List<DeliveryAssignment>
    findByDeliveryId(Long deliveryId);
}