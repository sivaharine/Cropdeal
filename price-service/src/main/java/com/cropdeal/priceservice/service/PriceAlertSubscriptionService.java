package com.cropdeal.priceservice.service;

import com.cropdeal.priceservice.dto.PriceAlertSubscriptionRequest;
import com.cropdeal.priceservice.dto.PriceAlertSubscriptionResponse;
import com.cropdeal.priceservice.entity.PriceAlertSubscription;
import com.cropdeal.priceservice.exception.InvalidSubscriptionException;
import com.cropdeal.priceservice.exception.SubscriptionNotFoundException;
import com.cropdeal.priceservice.exception.UnauthorizedAlertAccessException;
import com.cropdeal.priceservice.repository.PriceAlertSubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PriceAlertSubscriptionService {

    private final PriceAlertSubscriptionRepository repository;

    public PriceAlertSubscriptionService(PriceAlertSubscriptionRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public PriceAlertSubscriptionResponse createSubscription(PriceAlertSubscriptionRequest request, Long userId, String userRole) {
        validateRole(userRole);
        validateRequest(request);

        PriceAlertSubscription sub = new PriceAlertSubscription();
        sub.setUserId(userId);
        sub.setUserRole(cleanRole(userRole));
        sub.setCropName(request.getCropName().trim());
        sub.setTargetPrice(request.getTargetPrice());
        sub.setPriceCondition(request.getPriceCondition());
        sub.setDistrict(cleanOptional(request.getDistrict()));
        sub.setState(cleanOptional(request.getState()));
        sub.setUnit(request.getUnit() != null && !request.getUnit().isBlank() ? request.getUnit().trim().toUpperCase() : "KG");
        sub.setActive(request.getActive() != null ? request.getActive() : true);

        return toResponse(repository.save(sub));
    }

    @Transactional(readOnly = true)
    public List<PriceAlertSubscriptionResponse> getSubscriptions(Long userId, String userRole) {
        if (isAdmin(userRole)) {
            return repository.findAll().stream().map(this::toResponse).toList();
        }
        return repository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PriceAlertSubscriptionResponse getSubscriptionById(Long id, Long userId, String userRole) {
        PriceAlertSubscription sub = getEntity(id);
        verifyOwnership(sub, userId, userRole);
        return toResponse(sub);
    }

    @Transactional
    public PriceAlertSubscriptionResponse updateSubscription(Long id, PriceAlertSubscriptionRequest request, Long userId, String userRole) {
        PriceAlertSubscription sub = getEntity(id);
        verifyOwnership(sub, userId, userRole);
        validateRequest(request);

        sub.setCropName(request.getCropName().trim());
        sub.setTargetPrice(request.getTargetPrice());
        sub.setPriceCondition(request.getPriceCondition());
        sub.setDistrict(cleanOptional(request.getDistrict()));
        sub.setState(cleanOptional(request.getState()));
        if (request.getUnit() != null && !request.getUnit().isBlank()) {
            sub.setUnit(request.getUnit().trim().toUpperCase());
        }
        if (request.getActive() != null) {
            sub.setActive(request.getActive());
        }

        return toResponse(repository.save(sub));
    }

    @Transactional
    public void deleteSubscription(Long id, Long userId, String userRole) {
        PriceAlertSubscription sub = getEntity(id);
        verifyOwnership(sub, userId, userRole);
        repository.delete(sub);
    }

    @Transactional
    public PriceAlertSubscriptionResponse activateSubscription(Long id, Long userId, String userRole) {
        PriceAlertSubscription sub = getEntity(id);
        verifyOwnership(sub, userId, userRole);
        sub.setActive(true);
        return toResponse(repository.save(sub));
    }

    @Transactional
    public PriceAlertSubscriptionResponse deactivateSubscription(Long id, Long userId, String userRole) {
        PriceAlertSubscription sub = getEntity(id);
        verifyOwnership(sub, userId, userRole);
        sub.setActive(false);
        return toResponse(repository.save(sub));
    }

    private void verifyOwnership(PriceAlertSubscription sub, Long userId, String userRole) {
        if (isAdmin(userRole)) return;
        if (userId == null || !userId.equals(sub.getUserId())) {
            throw new UnauthorizedAlertAccessException("You are not authorized to access or modify this price alert subscription");
        }
    }

    private void validateRole(String userRole) {
        if (userRole == null) {
            throw new UnauthorizedAlertAccessException("Authentication required: missing role");
        }
        String clean = cleanRole(userRole);
        if (!"FARMER".equals(clean) && !"DEALER".equals(clean) && !"ADMIN".equals(clean)) {
            throw new InvalidSubscriptionException("Only FARMER and DEALER roles can create price alert subscriptions");
        }
    }

    private void validateRequest(PriceAlertSubscriptionRequest req) {
        if (req.getCropName() == null || req.getCropName().trim().isBlank()) {
            throw new InvalidSubscriptionException("Crop name is required");
        }
        if (req.getTargetPrice() == null || req.getTargetPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidSubscriptionException("Target price must be greater than 0");
        }
        if (req.getPriceCondition() == null) {
            throw new InvalidSubscriptionException("Price condition is required");
        }
    }

    private String cleanRole(String r) {
        if (r == null) return "";
        return r.replace("ROLE_", "").trim().toUpperCase();
    }

    private boolean isAdmin(String role) {
        return role != null && role.contains("ADMIN");
    }

    private String cleanOptional(String s) {
        return (s == null || s.trim().isBlank()) ? null : s.trim();
    }

    private PriceAlertSubscription getEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new SubscriptionNotFoundException("Price alert subscription not found with id: " + id));
    }

    private PriceAlertSubscriptionResponse toResponse(PriceAlertSubscription s) {
        PriceAlertSubscriptionResponse r = new PriceAlertSubscriptionResponse();
        r.setId(s.getId());
        r.setUserId(s.getUserId());
        r.setUserRole(s.getUserRole());
        r.setCropName(s.getCropName());
        r.setTargetPrice(s.getTargetPrice());
        r.setPriceCondition(s.getPriceCondition());
        r.setDistrict(s.getDistrict());
        r.setState(s.getState());
        r.setUnit(s.getUnit());
        r.setActive(s.getActive());
        r.setLastNotifiedAt(s.getLastNotifiedAt());
        r.setCreatedAt(s.getCreatedAt());
        r.setUpdatedAt(s.getUpdatedAt());
        return r;
    }
}