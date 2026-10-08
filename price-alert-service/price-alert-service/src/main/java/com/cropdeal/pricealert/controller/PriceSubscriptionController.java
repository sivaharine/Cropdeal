package com.cropdeal.pricealert.controller;

import com.cropdeal.pricealert.dto.CreateSubscriptionRequest;
import com.cropdeal.pricealert.dto.SubscriptionResponse;
import com.cropdeal.pricealert.entity.PriceAlertNotification;
import com.cropdeal.pricealert.service.PriceSubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/price-alerts/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Price Alert Subscriptions", description = "Endpoints for managing crop price subscriptions for Farmers and Dealers")
public class PriceSubscriptionController {

    private final PriceSubscriptionService subscriptionService;
    private final com.cropdeal.pricealert.service.DatabasePriceCheckService databasePriceCheckService;

    @PostMapping
    @Operation(summary = "Create price alert subscription", description = "Allows Farmers or Dealers to subscribe to crop price alerts with threshold conditions")
    public ResponseEntity<SubscriptionResponse> createSubscription(@Valid @RequestBody CreateSubscriptionRequest request) {
        SubscriptionResponse response = subscriptionService.createSubscription(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get subscriptions for user", description = "Retrieves all price alert subscriptions created by a specific user")
    public ResponseEntity<List<SubscriptionResponse>> getSubscriptionsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionsByUser(userId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get subscription by ID")
    public ResponseEntity<SubscriptionResponse> getSubscriptionById(@PathVariable Long id) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionById(id));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Toggle subscription active status", description = "Enable or disable an existing price alert subscription")
    public ResponseEntity<SubscriptionResponse> toggleStatus(
            @PathVariable Long id,
            @RequestParam boolean active) {
        return ResponseEntity.ok(subscriptionService.toggleSubscriptionStatus(id, active));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete subscription")
    public ResponseEntity<Void> deleteSubscription(@PathVariable Long id) {
        subscriptionService.deleteSubscription(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/history/user/{userId}")
    @Operation(summary = "Get triggered price alert history for user", description = "Fetches audit log of price alerts dispatched to this user")
    public ResponseEntity<List<PriceAlertNotification>> getAlertHistoryForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(subscriptionService.getAlertHistoryForUser(userId));
    }

    @PostMapping("/check-on-login/{userId}")
    @Operation(summary = "Check crop alerts for user upon login",
               description = "Queries stored database prices and triggers matching alerts specifically when user logs in.")
    public ResponseEntity<com.cropdeal.pricealert.dto.MatchResultResponse> checkOnLoginPost(@PathVariable Long userId) {
        return ResponseEntity.ok(databasePriceCheckService.checkUserSubscriptionsOnLogin(userId));
    }

    @GetMapping("/check-on-login/{userId}")
    @Operation(summary = "Check crop alerts for user upon login (GET)",
               description = "Queries stored database prices and triggers matching alerts specifically when user logs in.")
    public ResponseEntity<com.cropdeal.pricealert.dto.MatchResultResponse> checkOnLoginGet(@PathVariable Long userId) {
        return ResponseEntity.ok(databasePriceCheckService.checkUserSubscriptionsOnLogin(userId));
    }
}
