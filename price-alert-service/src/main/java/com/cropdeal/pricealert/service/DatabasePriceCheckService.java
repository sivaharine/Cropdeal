package com.cropdeal.pricealert.service;

import com.cropdeal.pricealert.client.PriceServiceClient;
import com.cropdeal.pricealert.dto.DatabasePriceDto;
import com.cropdeal.pricealert.dto.MatchMarketPriceRequest;
import com.cropdeal.pricealert.dto.MatchResultResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatabasePriceCheckService {

    private final PriceServiceClient priceServiceClient;
    private final PriceAlertMatchingEngine matchingEngine;

    /**
     * Checks all active subscriptions against the government/market prices stored in our local DB.
     * This avoids continuously fetching from external government APIs.
     */
    public MatchResultResponse checkActiveSubscriptionsAgainstDatabasePrices() {
        log.info("Starting evaluation of active price subscriptions against prices stored in our database...");

        List<DatabasePriceDto> dbPrices = priceServiceClient.getLatestStoredPricesFromDb();
        if (dbPrices.isEmpty()) {
            log.info("No stored crop prices available in database at this moment.");
            return MatchResultResponse.builder()
                    .matchedCount(0)
                    .notificationsTriggered(0)
                    .message("No prices currently stored in database to evaluate.")
                    .build();
        }

        int totalEvaluated = 0;
        int totalTriggered = 0;
        long syntheticId = 1000L;

        for (DatabasePriceDto priceDto : dbPrices) {
            if (priceDto.getCommodity() == null || priceDto.getCommodity().isBlank()) {
                continue;
            }

            Double priceVal = priceDto.getModalPricePerKg();
            if (priceVal == null || priceVal <= 0) {
                if (priceDto.getMinPricePerKg() != null && priceDto.getMinPricePerKg() > 0) {
                    priceVal = priceDto.getMinPricePerKg();
                } else if (priceDto.getMaxPricePerKg() != null && priceDto.getMaxPricePerKg() > 0) {
                    priceVal = priceDto.getMaxPricePerKg();
                } else {
                    continue;
                }
            }

            BigDecimal effectivePrice = BigDecimal.valueOf(priceVal).setScale(2, RoundingMode.HALF_UP);
            syntheticId++;

            MatchMarketPriceRequest matchRequest = MatchMarketPriceRequest.builder()
                    .priceId(syntheticId)
                    .cropName(priceDto.getCommodity())
                    .marketPrice(effectivePrice)
                    .marketName(priceDto.getState() != null ? priceDto.getState() + " Mandi" : "Government Mandi")
                    .district(priceDto.getDistrict())
                    .state(priceDto.getState())
                    .unit("kg")
                    .build();

            int matched = matchingEngine.matchMarketPrice(matchRequest);
            totalEvaluated++;
            totalTriggered += matched;
        }

        String msg = String.format("Evaluated %d database crop prices against active subscriptions. Alerts triggered: %d",
                totalEvaluated, totalTriggered);
        log.info(msg);

        return MatchResultResponse.builder()
                .matchedCount(totalEvaluated)
                .notificationsTriggered(totalTriggered)
                .message(msg)
                .build();
    }

    /**
     * Checks crop price subscriptions against our database prices ONLY upon user login.
     * No background continuous polling is performed.
     */
    public MatchResultResponse checkUserSubscriptionsOnLogin(Long userId) {
        if (userId == null) {
            return MatchResultResponse.builder()
                    .matchedCount(0)
                    .notificationsTriggered(0)
                    .message("User ID is required for login price check.")
                    .build();
        }

        log.info("Checking crop alerts from local database for userId {} on login...", userId);

        List<DatabasePriceDto> dbPrices = priceServiceClient.getLatestStoredPricesFromDb();
        if (dbPrices == null || dbPrices.isEmpty()) {
            log.info("No stored crop prices available in database at this moment for user {}.", userId);
            return MatchResultResponse.builder()
                    .matchedCount(0)
                    .notificationsTriggered(0)
                    .message("No prices currently stored in database.")
                    .build();
        }

        int totalEvaluated = 0;
        int totalTriggered = 0;
        long syntheticId = 1000L;

        for (DatabasePriceDto priceDto : dbPrices) {
            if (priceDto.getCommodity() == null || priceDto.getCommodity().isBlank()) {
                continue;
            }

            Double priceVal = priceDto.getModalPricePerKg();
            if (priceVal == null || priceVal <= 0) {
                if (priceDto.getMinPricePerKg() != null && priceDto.getMinPricePerKg() > 0) {
                    priceVal = priceDto.getMinPricePerKg();
                } else if (priceDto.getMaxPricePerKg() != null && priceDto.getMaxPricePerKg() > 0) {
                    priceVal = priceDto.getMaxPricePerKg();
                } else {
                    continue;
                }
            }

            BigDecimal effectivePrice = BigDecimal.valueOf(priceVal).setScale(2, RoundingMode.HALF_UP);
            syntheticId++;

            MatchMarketPriceRequest matchRequest = MatchMarketPriceRequest.builder()
                    .priceId(syntheticId)
                    .cropName(priceDto.getCommodity())
                    .marketPrice(effectivePrice)
                    .marketName(priceDto.getState() != null ? priceDto.getState() + " Mandi" : "Government Mandi")
                    .district(priceDto.getDistrict())
                    .state(priceDto.getState())
                    .unit("kg")
                    .build();

            int matched = matchingEngine.matchUserSubscriptionsAgainstMarketPrice(userId, matchRequest);
            totalEvaluated++;
            totalTriggered += matched;
        }

        String msg = String.format("Evaluated %d database crop prices for user %d on login. New alerts triggered: %d",
                totalEvaluated, userId, totalTriggered);
        log.info(msg);

        return MatchResultResponse.builder()
                .matchedCount(totalEvaluated)
                .notificationsTriggered(totalTriggered)
                .message(msg)
                .build();
    }
}
