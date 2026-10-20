package com.cropdeal.pricealert.service;

import com.cropdeal.pricealert.dto.CreateSubscriptionRequest;
import com.cropdeal.pricealert.dto.SubscriptionResponse;
import com.cropdeal.pricealert.entity.PriceAlertNotification;
import com.cropdeal.pricealert.entity.PriceAlertSubscription;
import com.cropdeal.pricealert.repository.PriceAlertNotificationRepository;
import com.cropdeal.pricealert.repository.PriceAlertSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceSubscriptionService {

    private final PriceAlertSubscriptionRepository subscriptionRepository;
    private final PriceAlertNotificationRepository notificationRepository;

    @Transactional
    public SubscriptionResponse createSubscription(CreateSubscriptionRequest request) {
        log.info("Creating price subscription for userId={}, role={}, crop={}, targetPrice={}",
                request.getUserId(), request.getUserRole(), request.getCropName(), request.getTargetPrice());

        PriceAlertSubscription subscription = PriceAlertSubscription.builder()
                .userId(request.getUserId())
                .userRole(request.getUserRole())
                .cropName(request.getCropName().trim().toLowerCase())
                .targetPrice(request.getTargetPrice())
                .priceCondition(request.getPriceCondition())
                .district(request.getDistrict() != null ? request.getDistrict().trim() : null)
                .state(request.getState() != null ? request.getState().trim() : null)
                .unit(request.getUnit() != null ? request.getUnit().trim() : "kg")
                .active(true)
                .build();

        PriceAlertSubscription saved = subscriptionRepository.save(subscription);
        return SubscriptionResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionResponse> getSubscriptionsByUser(Long userId) {
        return subscriptionRepository.findByUserId(userId).stream()
                .map(SubscriptionResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubscriptionResponse getSubscriptionById(Long id) {
        return subscriptionRepository.findById(id)
                .map(SubscriptionResponse::fromEntity)
                .orElseThrow(() -> new NoSuchElementException("Price alert subscription not found with id: " + id));
    }

    @Transactional
    public SubscriptionResponse toggleSubscriptionStatus(Long id, boolean active) {
        PriceAlertSubscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Price alert subscription not found with id: " + id));
        subscription.setActive(active);
        PriceAlertSubscription saved = subscriptionRepository.save(subscription);
        return SubscriptionResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteSubscription(Long id) {
        if (!subscriptionRepository.existsById(id)) {
            throw new NoSuchElementException("Price alert subscription not found with id: " + id);
        }
        subscriptionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<PriceAlertNotification> getAlertHistoryForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByTriggeredAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<PriceAlertNotification> getAlertHistoryForSubscription(Long subscriptionId) {
        return notificationRepository.findBySubscriptionIdOrderByTriggeredAtDesc(subscriptionId);
    }
}
