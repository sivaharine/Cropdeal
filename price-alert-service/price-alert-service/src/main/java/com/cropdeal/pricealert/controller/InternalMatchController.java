package com.cropdeal.pricealert.controller;

import com.cropdeal.pricealert.dto.MatchCropListingRequest;
import com.cropdeal.pricealert.dto.MatchMarketPriceRequest;
import com.cropdeal.pricealert.dto.MatchResultResponse;
import com.cropdeal.pricealert.service.PriceAlertMatchingEngine;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/price-alerts/match")
@RequiredArgsConstructor
@Tag(name = "Internal Price Matching Engine", description = "Internal endpoints invoked by crop-service and price-service to trigger price matching")
public class InternalMatchController {

    private final PriceAlertMatchingEngine matchingEngine;
    private final com.cropdeal.pricealert.service.DatabasePriceCheckService databasePriceCheckService;

    @PostMapping("/crop-listing")
    @Operation(summary = "Match newly created crop listing", description = "Invoked by crop-service when a farmer lists a crop. Matches dealer subscriptions.")
    public ResponseEntity<MatchResultResponse> matchCropListing(@Valid @RequestBody MatchCropListingRequest request) {
        int matched = matchingEngine.matchCropListing(request);
        return ResponseEntity.ok(MatchResultResponse.builder()
                .matchedCount(matched)
                .notificationsTriggered(matched)
                .message("Processed crop listing price match. Alerts triggered: " + matched)
                .build());
    }

    @PostMapping("/market-price")
    @Operation(summary = "Match synced daily government market price", description = "Invoked by price-service when mandi prices sync. Matches farmer & dealer subscriptions.")
    public ResponseEntity<MatchResultResponse> matchMarketPrice(@Valid @RequestBody MatchMarketPriceRequest request) {
        int matched = matchingEngine.matchMarketPrice(request);
        return ResponseEntity.ok(MatchResultResponse.builder()
                .matchedCount(matched)
                .notificationsTriggered(matched)
                .message("Processed market price match. Alerts triggered: " + matched)
                .build());
    }

    @PostMapping("/check-stored-prices")
    @Operation(summary = "Check subscriptions against stored database prices",
               description = "Queries stored government and market prices from our database and matches against all active subscriptions without hitting external government APIs.")
    public ResponseEntity<MatchResultResponse> checkStoredDatabasePrices() {
        return ResponseEntity.ok(databasePriceCheckService.checkActiveSubscriptionsAgainstDatabasePrices());
    }

    @PostMapping("/check-on-login/{userId}")
    @Operation(summary = "Check crop alerts for user upon login",
               description = "Queries stored government prices from our database and matches only against this user's active subscriptions upon login.")
    public ResponseEntity<MatchResultResponse> checkOnLoginPost(@org.springframework.web.bind.annotation.PathVariable Long userId) {
        return ResponseEntity.ok(databasePriceCheckService.checkUserSubscriptionsOnLogin(userId));
    }

    @org.springframework.web.bind.annotation.GetMapping("/check-on-login/{userId}")
    @Operation(summary = "Check crop alerts for user upon login (GET)",
               description = "Queries stored government prices from our database and matches only against this user's active subscriptions upon login.")
    public ResponseEntity<MatchResultResponse> checkOnLoginGet(@org.springframework.web.bind.annotation.PathVariable Long userId) {
        return ResponseEntity.ok(databasePriceCheckService.checkUserSubscriptionsOnLogin(userId));
    }
}
