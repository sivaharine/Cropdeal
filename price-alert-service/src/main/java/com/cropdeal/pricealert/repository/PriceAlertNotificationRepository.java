package com.cropdeal.pricealert.repository;

import com.cropdeal.pricealert.entity.PriceAlertNotification;
import com.cropdeal.pricealert.enums.AlertSourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PriceAlertNotificationRepository extends JpaRepository<PriceAlertNotification, Long> {

    boolean existsBySubscriptionIdAndSourceTypeAndSourceId(
            Long subscriptionId, AlertSourceType sourceType, Long sourceId);

    List<PriceAlertNotification> findByUserIdOrderByTriggeredAtDesc(Long userId);

    List<PriceAlertNotification> findBySubscriptionIdOrderByTriggeredAtDesc(Long subscriptionId);
}
