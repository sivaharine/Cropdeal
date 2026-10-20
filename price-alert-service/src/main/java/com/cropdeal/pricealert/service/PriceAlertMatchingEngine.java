package com.cropdeal.pricealert.service;

import com.cropdeal.pricealert.dto.MatchCropListingRequest;
import com.cropdeal.pricealert.dto.MatchMarketPriceRequest;
import com.cropdeal.pricealert.dto.PriceAlertTriggeredEvent;
import com.cropdeal.pricealert.entity.DealerBuyingRequest;
import com.cropdeal.pricealert.entity.PriceAlertNotification;
import com.cropdeal.pricealert.entity.PriceAlertSubscription;
import com.cropdeal.pricealert.enums.AlertSourceType;
import com.cropdeal.pricealert.enums.PriceCondition;
import com.cropdeal.pricealert.enums.UserRole;
import com.cropdeal.pricealert.repository.PriceAlertNotificationRepository;
import com.cropdeal.pricealert.repository.PriceAlertSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceAlertMatchingEngine {

    private final PriceAlertSubscriptionRepository subscriptionRepository;
    private final PriceAlertNotificationRepository notificationRepository;
    private final PriceAlertPublisher alertPublisher;

    public boolean evaluatePriceCondition(PriceCondition condition, BigDecimal targetPrice, BigDecimal currentPrice) {
        if (condition == null || targetPrice == null || currentPrice == null) {
            return false;
        }
        int cmp = currentPrice.compareTo(targetPrice);
        return switch (condition) {
            case LESS_THAN -> cmp < 0;
            case LESS_THAN_OR_EQUAL -> cmp <= 0;
            case GREATER_THAN -> cmp > 0;
            case GREATER_THAN_OR_EQUAL -> cmp >= 0;
            case EQUAL -> cmp == 0;
        };
    }

    /**
     * Matches a newly created farmer crop listing against active DEALER subscriptions.
     */
    @Transactional
    public int matchCropListing(MatchCropListingRequest request) {
        if (request == null || request.getCropName() == null || request.getPrice() == null) {
            return 0;
        }

        String cropName = request.getCropName().trim().toLowerCase();
        List<PriceAlertSubscription> subscriptions = subscriptionRepository.findActiveMatchingSubscriptionsByRole(
                cropName, UserRole.DEALER, request.getDistrict());

        log.info("Matching CropListing [id={}, crop={}, price={}] against {} active Dealer subscriptions",
                request.getListingId(), cropName, request.getPrice(), subscriptions.size());

        int count = 0;
        for (PriceAlertSubscription sub : subscriptions) {
            if (evaluatePriceCondition(sub.getPriceCondition(), sub.getTargetPrice(), request.getPrice())) {
                boolean alreadyNotified = notificationRepository.existsBySubscriptionIdAndSourceTypeAndSourceId(
                        sub.getId(), AlertSourceType.CROP_LISTING, request.getListingId());

                if (!alreadyNotified) {
                    String cropDisplay = capitalize(request.getCropName());
                    String loc = (request.getDistrict() != null && !request.getDistrict().isBlank())
                            ? " in " + request.getDistrict() : "";
                    String unit = request.getUnit() != null ? request.getUnit() : "kg";
                    String title = String.format("Price Alert: %s Available at ₹%.2f/%s",
                            cropDisplay, request.getPrice(), unit);
                    String message = String.format("%s is now available at ₹%.2f/%s%s, below your target price of ₹%.2f/%s.",
                            cropDisplay, request.getPrice(), unit, loc, sub.getTargetPrice(), sub.getUnit());

                    PriceAlertNotification notif = PriceAlertNotification.builder()
                            .subscriptionId(sub.getId())
                            .userId(sub.getUserId())
                            .sourceType(AlertSourceType.CROP_LISTING)
                            .sourceId(request.getListingId())
                            .cropName(request.getCropName())
                            .targetPrice(sub.getTargetPrice())
                            .matchedPrice(request.getPrice())
                            .message(message)
                            .notificationSent(true)
                            .triggeredAt(LocalDateTime.now())
                            .build();
                    notificationRepository.save(notif);

                    sub.setLastNotifiedAt(LocalDateTime.now());
                    subscriptionRepository.save(sub);

                    PriceAlertTriggeredEvent event = PriceAlertTriggeredEvent.builder()
                            .subscriptionId(sub.getId())
                            .userId(sub.getUserId())
                            .userRole(sub.getUserRole())
                            .cropName(cropDisplay)
                            .targetPrice(sub.getTargetPrice())
                            .matchedPrice(request.getPrice())
                            .priceCondition(sub.getPriceCondition())
                            .sourceType(AlertSourceType.CROP_LISTING)
                            .sourceId(request.getListingId())
                            .district(request.getDistrict())
                            .state(request.getState())
                            .unit(unit)
                            .title(title)
                            .message(message)
                            .timestamp(LocalDateTime.now())
                            .build();

                    alertPublisher.publishAlert(event);
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * Matches a dealer buying request against active FARMER subscriptions.
     */
    @Transactional
    public int matchDealerBuyingRequest(DealerBuyingRequest buyingRequest) {
        if (buyingRequest == null || buyingRequest.getCropName() == null || buyingRequest.getOfferedPrice() == null) {
            return 0;
        }

        String cropName = buyingRequest.getCropName().trim().toLowerCase();
        List<PriceAlertSubscription> subscriptions = subscriptionRepository.findActiveMatchingSubscriptionsByRole(
                cropName, UserRole.FARMER, buyingRequest.getDistrict());

        log.info("Matching DealerBuyingRequest [id={}, crop={}, offeredPrice={}] against {} active Farmer subscriptions",
                buyingRequest.getId(), cropName, buyingRequest.getOfferedPrice(), subscriptions.size());

        int count = 0;
        for (PriceAlertSubscription sub : subscriptions) {
            if (evaluatePriceCondition(sub.getPriceCondition(), sub.getTargetPrice(), buyingRequest.getOfferedPrice())) {
                boolean alreadyNotified = notificationRepository.existsBySubscriptionIdAndSourceTypeAndSourceId(
                        sub.getId(), AlertSourceType.BUYING_REQUEST, buyingRequest.getId());

                if (!alreadyNotified) {
                    String cropDisplay = capitalize(buyingRequest.getCropName());
                    String loc = (buyingRequest.getDistrict() != null && !buyingRequest.getDistrict().isBlank())
                            ? "A dealer in " + buyingRequest.getDistrict() : "A dealer";
                    String unit = buyingRequest.getUnit() != null ? buyingRequest.getUnit() : "kg";
                    String title = String.format("Buyer Request: %s at ₹%.2f/%s",
                            cropDisplay, buyingRequest.getOfferedPrice(), unit);
                    String message = String.format("%s wants to buy %s at ₹%.2f/%s, matching your expected price of ₹%.2f/%s.",
                            loc, cropDisplay, buyingRequest.getOfferedPrice(), unit, sub.getTargetPrice(), sub.getUnit());

                    PriceAlertNotification notif = PriceAlertNotification.builder()
                            .subscriptionId(sub.getId())
                            .userId(sub.getUserId())
                            .sourceType(AlertSourceType.BUYING_REQUEST)
                            .sourceId(buyingRequest.getId())
                            .cropName(buyingRequest.getCropName())
                            .targetPrice(sub.getTargetPrice())
                            .matchedPrice(buyingRequest.getOfferedPrice())
                            .message(message)
                            .notificationSent(true)
                            .triggeredAt(LocalDateTime.now())
                            .build();
                    notificationRepository.save(notif);

                    sub.setLastNotifiedAt(LocalDateTime.now());
                    subscriptionRepository.save(sub);

                    PriceAlertTriggeredEvent event = PriceAlertTriggeredEvent.builder()
                            .subscriptionId(sub.getId())
                            .userId(sub.getUserId())
                            .userRole(sub.getUserRole())
                            .cropName(cropDisplay)
                            .targetPrice(sub.getTargetPrice())
                            .matchedPrice(buyingRequest.getOfferedPrice())
                            .priceCondition(sub.getPriceCondition())
                            .sourceType(AlertSourceType.BUYING_REQUEST)
                            .sourceId(buyingRequest.getId())
                            .district(buyingRequest.getDistrict())
                            .state(buyingRequest.getState())
                            .unit(unit)
                            .title(title)
                            .message(message)
                            .timestamp(LocalDateTime.now())
                            .build();

                    alertPublisher.publishAlert(event);
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * Matches daily government market price updates against all active subscriptions (Dealers and Farmers).
     */
    @Transactional
    public int matchMarketPrice(MatchMarketPriceRequest request) {
        if (request == null || request.getCropName() == null || request.getMarketPrice() == null) {
            return 0;
        }

        String cropName = request.getCropName().trim().toLowerCase();
        List<PriceAlertSubscription> subscriptions = subscriptionRepository.findActiveMatchingSubscriptions(
                cropName, request.getDistrict());

        log.info("Matching Government Market Price [priceId={}, crop={}, price={}] against {} active subscriptions",
                request.getPriceId(), cropName, request.getMarketPrice(), subscriptions.size());

        int count = 0;
        for (PriceAlertSubscription sub : subscriptions) {
            if (evaluatePriceCondition(sub.getPriceCondition(), sub.getTargetPrice(), request.getMarketPrice())) {
                boolean alreadyNotified = notificationRepository.existsBySubscriptionIdAndSourceTypeAndSourceId(
                        sub.getId(), AlertSourceType.MARKET_PRICE, request.getPriceId());

                if (!alreadyNotified) {
                    String cropDisplay = capitalize(request.getCropName());
                    String loc = (request.getDistrict() != null && !request.getDistrict().isBlank())
                            ? " in " + request.getDistrict() : "";
                    String unit = request.getUnit() != null ? request.getUnit() : "kg";
                    String title = String.format("Government Price Update: %s at ₹%.2f/%s",
                            cropDisplay, request.getMarketPrice(), unit);
                    String message = String.format("Government market price for %s%s has reached ₹%.2f/%s.",
                            cropDisplay, loc, request.getMarketPrice(), unit);

                    PriceAlertNotification notif = PriceAlertNotification.builder()
                            .subscriptionId(sub.getId())
                            .userId(sub.getUserId())
                            .sourceType(AlertSourceType.MARKET_PRICE)
                            .sourceId(request.getPriceId())
                            .cropName(request.getCropName())
                            .targetPrice(sub.getTargetPrice())
                            .matchedPrice(request.getMarketPrice())
                            .message(message)
                            .notificationSent(true)
                            .triggeredAt(LocalDateTime.now())
                            .build();
                    notificationRepository.save(notif);

                    sub.setLastNotifiedAt(LocalDateTime.now());
                    subscriptionRepository.save(sub);

                    PriceAlertTriggeredEvent event = PriceAlertTriggeredEvent.builder()
                            .subscriptionId(sub.getId())
                            .userId(sub.getUserId())
                            .userRole(sub.getUserRole())
                            .cropName(cropDisplay)
                            .targetPrice(sub.getTargetPrice())
                            .matchedPrice(request.getMarketPrice())
                            .priceCondition(sub.getPriceCondition())
                            .sourceType(AlertSourceType.MARKET_PRICE)
                            .sourceId(request.getPriceId())
                            .district(request.getDistrict())
                            .state(request.getState())
                            .unit(unit)
                            .title(title)
                            .message(message)
                            .timestamp(LocalDateTime.now())
                            .build();

                    alertPublisher.publishAlert(event);
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * Matches stored database prices for a specific user's active subscriptions ONLY upon user login.
     */
    @Transactional
    public int matchUserSubscriptionsAgainstMarketPrice(Long userId, MatchMarketPriceRequest request) {
        if (request == null || request.getCropName() == null || request.getMarketPrice() == null || userId == null) {
            return 0;
        }

        String cropName = request.getCropName().trim().toLowerCase();
        List<PriceAlertSubscription> userSubscriptions = subscriptionRepository.findByUserIdAndActiveTrue(userId);

        int count = 0;
        for (PriceAlertSubscription sub : userSubscriptions) {
            if (!sub.getCropName().trim().equalsIgnoreCase(cropName)) {
                continue;
            }
            if (request.getDistrict() != null && sub.getDistrict() != null &&
                    !request.getDistrict().isBlank() && !sub.getDistrict().isBlank() &&
                    !request.getDistrict().equalsIgnoreCase(sub.getDistrict())) {
                continue;
            }

            if (evaluatePriceCondition(sub.getPriceCondition(), sub.getTargetPrice(), request.getMarketPrice())) {
                boolean alreadyNotified = notificationRepository.existsBySubscriptionIdAndSourceTypeAndSourceId(
                        sub.getId(), AlertSourceType.MARKET_PRICE, request.getPriceId());

                if (!alreadyNotified) {
                    String cropDisplay = capitalize(request.getCropName());
                    String loc = (request.getDistrict() != null && !request.getDistrict().isBlank())
                            ? " in " + request.getDistrict() : "";
                    String unit = request.getUnit() != null ? request.getUnit() : "kg";
                    String title = String.format("Login Crop Alert: %s at ₹%.2f/%s",
                            cropDisplay, request.getMarketPrice(), unit);
                    String message = String.format("Welcome back! Government market price in DB for %s%s is currently ₹%.2f/%s, matching your target of ₹%.2f/%s.",
                            cropDisplay, loc, request.getMarketPrice(), unit, sub.getTargetPrice(), sub.getUnit());

                    PriceAlertNotification notif = PriceAlertNotification.builder()
                            .subscriptionId(sub.getId())
                            .userId(sub.getUserId())
                            .sourceType(AlertSourceType.MARKET_PRICE)
                            .sourceId(request.getPriceId())
                            .cropName(request.getCropName())
                            .targetPrice(sub.getTargetPrice())
                            .matchedPrice(request.getMarketPrice())
                            .message(message)
                            .notificationSent(true)
                            .triggeredAt(LocalDateTime.now())
                            .build();
                    notificationRepository.save(notif);

                    sub.setLastNotifiedAt(LocalDateTime.now());
                    subscriptionRepository.save(sub);

                    PriceAlertTriggeredEvent event = PriceAlertTriggeredEvent.builder()
                            .subscriptionId(sub.getId())
                            .userId(sub.getUserId())
                            .userRole(sub.getUserRole())
                            .cropName(cropDisplay)
                            .targetPrice(sub.getTargetPrice())
                            .matchedPrice(request.getMarketPrice())
                            .priceCondition(sub.getPriceCondition())
                            .sourceType(AlertSourceType.MARKET_PRICE)
                            .sourceId(request.getPriceId())
                            .district(request.getDistrict())
                            .state(request.getState())
                            .unit(unit)
                            .title(title)
                            .message(message)
                            .timestamp(LocalDateTime.now())
                            .build();

                    alertPublisher.publishAlert(event);
                    count++;
                }
            }
        }
        return count;
    }

    private String capitalize(String str) {
        if (str == null || str.isBlank()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }
}
