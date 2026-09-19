package com.cropdeal.priceservice.repository;

import com.cropdeal.priceservice.entity.PriceAlertNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PriceAlertNotificationRepository extends JpaRepository<PriceAlertNotification, Long> {
    boolean existsBySubscriptionIdAndSourceTypeAndSourceId(Long subscriptionId, String sourceType, String sourceId);
}