package com.cropdeal.delivery.repository;

import com.cropdeal.delivery.entity.Delivery;
import com.cropdeal.delivery.entity.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    Optional<Delivery> findByOrderId(Long orderId);
    Optional<Delivery> findByDeliveryReference(String deliveryReference);
    List<Delivery> findByStatus(DeliveryStatus status);
    List<Delivery> findByDeliveryPartnerId(Long deliveryPartnerId);
    Optional<Delivery> findByIdAndDeliveryPartnerId(Long id, Long deliveryPartnerId);
}