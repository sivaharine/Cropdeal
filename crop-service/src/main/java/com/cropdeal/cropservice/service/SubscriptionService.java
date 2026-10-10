package com.cropdeal.cropservice.service;

import com.cropdeal.cropservice.dto.SubscriptionRequest;
import com.cropdeal.cropservice.dto.SubscriptionResponse;
import com.cropdeal.cropservice.entity.Crop;
import com.cropdeal.cropservice.entity.CropSubscription;
import com.cropdeal.cropservice.exception.SubscriptionNotFoundException;
import com.cropdeal.cropservice.repository.CropSubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SubscriptionService {
    private static final Logger log = LoggerFactory.getLogger(SubscriptionService.class);
    private final CropSubscriptionRepository repository;

    public SubscriptionService(CropSubscriptionRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public SubscriptionResponse subscribe(SubscriptionRequest request) {
        String commodity = normalizeRequired(request.getCommodity(), "Commodity");
        String state = normalizeOptional(request.getState());
        String district = normalizeOptional(request.getDistrict());
        String grade = normalizeGrade(request.getGrade());

        List<CropSubscription> exact = repository.findExactSubscription(commodity, state, district, grade);
        CropSubscription subscription = exact.stream()
                .filter(s -> s.getSubscriberId().equals(request.getSubscriberId()))
                .findFirst()
                .orElseGet(CropSubscription::new);

        subscription.setSubscriberId(request.getSubscriberId());
        subscription.setCommodity(commodity);
        subscription.setState(state);
        subscription.setDistrict(district);
        subscription.setGrade(grade);
        return toResponse(repository.save(subscription));
    }

    @Transactional
    public void unsubscribe(Long subscriptionId, Long subscriberId) {
        CropSubscription subscription = repository.findById(subscriptionId)
                .orElseThrow(() -> new SubscriptionNotFoundException("Subscription not found with id: " + subscriptionId));
        if (!subscription.getSubscriberId().equals(subscriberId)) {
            throw new SubscriptionNotFoundException("Subscription not found for subscriber: " + subscriberId);
        }
        repository.delete(subscription);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionResponse> bySubscriber(Long subscriberId) {
        List<SubscriptionResponse> result = repository.findBySubscriberIdOrderBySubscribedAtDesc(subscriberId)
                .stream().map(this::toResponse).toList();
        if (result.isEmpty()) {
            throw new SubscriptionNotFoundException("No subscriptions found for subscriber: " + subscriberId);
        }
        return result;
    }

    /** Returns subscriptions matching all non-null subscriber filters. Empty is normal internally. */
    @Transactional(readOnly = true)
    public List<CropSubscription> findMatchingSubscriptions(Crop crop) {
        return repository.findMatchingSubscriptions(crop.getCommodity(), crop.getState(), crop.getDistrict(), crop.getGrade());
    }

    /**
     * Identifies notification candidates. Actual delivery belongs to Notification Service.
     */
    @Transactional(readOnly = true)
    public void notifyMatchingSubscribers(Crop crop) {
        findMatchingSubscriptions(crop).forEach(s -> log.info(
                "Crop notification candidate: subscriberId={}, cropId={}, commodity={}, state={}, district={}, grade={}, pricePerKg={}",
                s.getSubscriberId(), crop.getId(), crop.getCommodity(), crop.getState(), crop.getDistrict(),
                crop.getGrade(), crop.getPricePerKg()));
    }

    private SubscriptionResponse toResponse(CropSubscription s) {
        return new SubscriptionResponse(s.getId(), s.getSubscriberId(), s.getCommodity(), s.getState(),
                s.getDistrict(), s.getGrade(), s.getSubscribedAt());
    }

    private String normalizeRequired(String value, String field) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(field + " is required");
        return value.trim();
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeGrade(String grade) {
        String value = normalizeOptional(grade);
        if (value == null) return null;
        value = value.toUpperCase();
        if (!value.matches("A|B|C")) throw new IllegalArgumentException("Grade must be A, B or C");
        return value;
    }
}
