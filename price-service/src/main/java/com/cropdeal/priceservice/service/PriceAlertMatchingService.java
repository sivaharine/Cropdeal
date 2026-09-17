package com.cropdeal.priceservice.service;

import com.cropdeal.priceservice.config.RabbitMQConfig;
import com.cropdeal.priceservice.dto.CropListingEvent;
import com.cropdeal.priceservice.dto.DealerBuyingRequestEvent;
import com.cropdeal.priceservice.dto.PriceAlertTriggeredEvent;
import com.cropdeal.priceservice.entity.*;
import com.cropdeal.priceservice.repository.PriceAlertNotificationRepository;
import com.cropdeal.priceservice.repository.PriceAlertSubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PriceAlertMatchingService {

    private static final Logger log = LoggerFactory.getLogger(PriceAlertMatchingService.class);

    private final PriceAlertSubscriptionRepository subscriptionRepository;
    private final PriceAlertNotificationRepository notificationRepository;
    private final RabbitTemplate rabbitTemplate;

    public PriceAlertMatchingService(
            PriceAlertSubscriptionRepository subscriptionRepository,
            PriceAlertNotificationRepository notificationRepository,
            RabbitTemplate rabbitTemplate) {
        this.subscriptionRepository = subscriptionRepository;
        this.notificationRepository = notificationRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Triggered for Farmer Crop Listing (Selling Price):
     * Matches active DEALER subscriptions only.
     */
    @Transactional
    public void processFarmerListing(CropListingEvent event) {
        if (event == null || event.getCommodity() == null || event.getPricePerKg() == null) {
            return;
        }

        log.info("Processing farmer listing price alert matching for cropId={}, commodity={}, price={}",
                event.getCropId(), event.getCommodity(), event.getPricePerKg());

        matchAndNotify(
                event.getCommodity(),
                event.getPricePerKg(),
                event.getUnit() != null ? event.getUnit() : "KG",
                event.getDistrict(),
                event.getState(),
                SourceType.FARMER_LISTING,
                String.valueOf(event.getCropId()),
                event.getQuantity(),
                "DEALER"
        );
    }

    /**
     * Triggered for Dealer Buying Request (Buying Price):
     * Matches active FARMER subscriptions only.
     */
    @Transactional
    public void processDealerBuyingRequest(DealerBuyingRequestEvent event) {
        if (event == null || event.getCropName() == null || event.getBuyingPrice() == null) {
            return;
        }

        log.info("Processing dealer buying request price alert matching for requestId={}, cropName={}, price={}",
                event.getRequestId(), event.getCropName(), event.getBuyingPrice());

        matchAndNotify(
                event.getCropName(),
                event.getBuyingPrice(),
                event.getUnit() != null ? event.getUnit() : "KG",
                event.getDistrict(),
                event.getState(),
                SourceType.DEALER_BUYING_REQUEST,
                String.valueOf(event.getRequestId()),
                event.getQuantity(),
                "FARMER"
        );
    }

    /**
     * Triggered for Government Market Price (Daily Mandi Price):
     * Matches active DEALER and FARMER subscriptions.
     */
    @Transactional
    public void processGovernmentPrice(MarketPrice price) {
        if (price == null || price.getCommodity() == null) {
            return;
        }

        Double priceVal = price.getModalPricePerKg() != null ? price.getModalPricePerKg() : price.getMinPricePerKg();
        if (priceVal == null || priceVal <= 0) {
            return;
        }

        BigDecimal pricePerKg = BigDecimal.valueOf(priceVal).setScale(2, RoundingMode.HALF_UP);
        String sourceId = (price.getId() != null ? price.getId().toString() : "0") + "_"
                + (price.getArrivalDate() != null ? price.getArrivalDate().toString() : "today");

        matchAndNotify(
                price.getCommodity(),
                pricePerKg,
                "KG",
                price.getDistrict(),
                price.getState(),
                SourceType.GOVERNMENT_MARKET_PRICE,
                sourceId,
                null,
                null
        );
    }

    /**
     * Central Reusable Matching Logic
     */
    public void matchAndNotify(
            String cropName,
            BigDecimal price,
            String unit,
            String district,
            String state,
            SourceType sourceType,
            String sourceId,
            BigDecimal quantity,
            String targetRole) {

        List<PriceAlertSubscription> candidates;
        if (targetRole != null) {
            candidates = subscriptionRepository.findByActiveTrueAndUserRole(targetRole);
        } else {
            candidates = subscriptionRepository.findByActiveTrue();
        }

        for (PriceAlertSubscription sub : candidates) {
            if (!matchesCrop(sub.getCropName(), cropName)) {
                continue;
            }

            if (!matchesLocation(sub.getDistrict(), district, sub.getState(), state)) {
                continue;
            }

            BigDecimal normalizedCurrentPrice = normalizePriceToKg(price, unit);
            BigDecimal normalizedTargetPrice = normalizePriceToKg(sub.getTargetPrice(), sub.getUnit());

            if (!evaluatesCondition(normalizedCurrentPrice, normalizedTargetPrice, sub.getPriceCondition())) {
                continue;
            }

            // Idempotency check: unique (subscriptionId, sourceType, sourceId)
            if (notificationRepository.existsBySubscriptionIdAndSourceTypeAndSourceId(sub.getId(), sourceType.name(), sourceId)) {
                log.info("Duplicate price alert skipped for subscriptionId={}, sourceType={}, sourceId={}",
                        sub.getId(), sourceType, sourceId);
                continue;
            }

            // Record notification for idempotency
            PriceAlertNotification notifRecord = new PriceAlertNotification(
                    sub.getId(),
                    sourceType.name(),
                    sourceId,
                    LocalDateTime.now()
            );
            notificationRepository.save(notifRecord);

            // Update lastNotifiedAt
            sub.setLastNotifiedAt(LocalDateTime.now());
            subscriptionRepository.save(sub);

            // Build and publish event
            PriceAlertTriggeredEvent event = new PriceAlertTriggeredEvent();
            event.setSubscriptionId(sub.getId());
            event.setUserId(sub.getUserId());
            event.setUserRole(sub.getUserRole());
            event.setSourceType(sourceType.name());
            event.setSourceId(sourceId);
            event.setCropName(cropName);
            event.setDistrict(district);
            event.setState(state);
            event.setTargetPrice(sub.getTargetPrice());
            event.setCurrentPrice(price);
            event.setQuantity(quantity);
            event.setUnit(sub.getUnit());
            event.setPriceCondition(sub.getPriceCondition().name());
            event.setMessage(buildMessage(sub, cropName, price, quantity, district, sourceType));

            try {
                rabbitTemplate.convertAndSend(
                        RabbitMQConfig.PRICE_ALERT_EXCHANGE,
                        RabbitMQConfig.PRICE_ALERT_ROUTING_KEY,
                        event
                );
                log.info("Published PriceAlertTriggeredEvent for user {} (Role: {}), crop: {}, price: {}",
                        sub.getUserId(), sub.getUserRole(), cropName, price);
            } catch (Exception e) {
                log.error("Failed to publish price alert event to RabbitMQ: {}", e.getMessage(), e);
            }
        }
    }

    public boolean matchesCrop(String subCrop, String eventCrop) {
        if (subCrop == null || eventCrop == null) return false;
        return normalizeString(subCrop).equalsIgnoreCase(normalizeString(eventCrop));
    }

    public boolean matchesLocation(String subDistrict, String eventDistrict, String subState, String eventState) {
        if (subDistrict != null && !subDistrict.isBlank()) {
            if (eventDistrict == null || !normalizeString(subDistrict).equalsIgnoreCase(normalizeString(eventDistrict))) {
                return false;
            }
        }
        if (subState != null && !subState.isBlank()) {
            if (eventState == null || !normalizeString(subState).equalsIgnoreCase(normalizeString(eventState))) {
                return false;
            }
        }
        return true;
    }

    public boolean evaluatesCondition(BigDecimal current, BigDecimal target, PriceCondition condition) {
        if (current == null || target == null || condition == null) return false;
        int cmp = current.compareTo(target);
        return switch (condition) {
            case GREATER_THAN -> cmp > 0;
            case GREATER_THAN_OR_EQUAL -> cmp >= 0;
            case LESS_THAN -> cmp < 0;
            case LESS_THAN_OR_EQUAL -> cmp <= 0;
            case EQUAL -> cmp == 0;
        };
    }

    public BigDecimal normalizePriceToKg(BigDecimal price, String unit) {
        if (price == null) return BigDecimal.ZERO;
        if (unit == null || unit.isBlank() || "KG".equalsIgnoreCase(unit.trim())) {
            return price;
        }
        if ("QUINTAL".equalsIgnoreCase(unit.trim()) || "Rs./Quintal".equalsIgnoreCase(unit.trim())) {
            return price.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        }
        if ("TON".equalsIgnoreCase(unit.trim()) || "TONNE".equalsIgnoreCase(unit.trim())) {
            return price.divide(BigDecimal.valueOf(1000), 4, RoundingMode.HALF_UP);
        }
        return price;
    }

    private String normalizeString(String s) {
        return s == null ? "" : s.trim().replaceAll("\\s+", " ");
    }

    private String buildMessage(PriceAlertSubscription sub, String cropName, BigDecimal price, BigDecimal quantity, String district, SourceType sourceType) {
        String loc = (district != null && !district.isBlank()) ? " in " + district : "";
        String qtyStr = (quantity != null) ? " (Quantity: " + quantity.stripTrailingZeros().toPlainString() + " " + sub.getUnit() + ")" : "";

        return switch (sourceType) {
            case FARMER_LISTING -> String.format(
                    "CropDeal Price Alert: A farmer has listed %s%s at â‚¹%s/%s%s, matching your target of â‚¹%s/%s (%s).",
                    cropName, loc, price.toPlainString(), sub.getUnit(), qtyStr, sub.getTargetPrice().toPlainString(), sub.getUnit(), sub.getPriceCondition());
            case DEALER_BUYING_REQUEST -> String.format(
                    "CropDeal Price Alert: A dealer is offering to buy %s%s at â‚¹%s/%s%s, matching your target of â‚¹%s/%s (%s).",
                    cropName, loc, price.toPlainString(), sub.getUnit(), qtyStr, sub.getTargetPrice().toPlainString(), sub.getUnit(), sub.getPriceCondition());
            case GOVERNMENT_MARKET_PRICE -> String.format(
                    "CropDeal Price Alert: Government market price for %s%s is now â‚¹%s/%s, matching your target of â‚¹%s/%s (%s).",
                    cropName, loc, price.toPlainString(), sub.getUnit(), sub.getTargetPrice().toPlainString(), sub.getUnit(), sub.getPriceCondition());
        };
    }
}