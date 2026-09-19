package com.cropdeal.priceservice.controller;

import com.cropdeal.priceservice.dto.PriceAlertSubscriptionRequest;
import com.cropdeal.priceservice.dto.PriceAlertSubscriptionResponse;
import com.cropdeal.priceservice.security.JwtService;
import com.cropdeal.priceservice.service.PriceAlertSubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prices/alerts")
@Tag(name = "Price Alert Subscription API", description = "Endpoints for managing farmer and dealer price alert subscriptions")
public class PriceAlertController {

    private final PriceAlertSubscriptionService subscriptionService;
    private final JwtService jwtService;

    public PriceAlertController(PriceAlertSubscriptionService subscriptionService, JwtService jwtService) {
        this.subscriptionService = subscriptionService;
        this.jwtService = jwtService;
    }

    @PostMapping
    @Operation(summary = "Create a price alert subscription for FARMER or DEALER")
    public ResponseEntity<PriceAlertSubscriptionResponse> createSubscription(
            @Valid @RequestBody PriceAlertSubscriptionRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestHeader(value = "X-User-Role", required = false) String headerUserRole) {

        Long userId = resolveUserId(authHeader, headerUserId);
        String userRole = resolveUserRole(authHeader, headerUserRole);

        PriceAlertSubscriptionResponse response = subscriptionService.createSubscription(request, userId, userRole);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "Get all price alert subscriptions for the authenticated user")
    public ResponseEntity<List<PriceAlertSubscriptionResponse>> getSubscriptions(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestHeader(value = "X-User-Role", required = false) String headerUserRole) {

        Long userId = resolveUserId(authHeader, headerUserId);
        String userRole = resolveUserRole(authHeader, headerUserRole);

        return ResponseEntity.ok(subscriptionService.getSubscriptions(userId, userRole));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single price alert subscription by ID")
    public ResponseEntity<PriceAlertSubscriptionResponse> getSubscription(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestHeader(value = "X-User-Role", required = false) String headerUserRole) {

        Long userId = resolveUserId(authHeader, headerUserId);
        String userRole = resolveUserRole(authHeader, headerUserRole);

        return ResponseEntity.ok(subscriptionService.getSubscriptionById(id, userId, userRole));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing price alert subscription")
    public ResponseEntity<PriceAlertSubscriptionResponse> updateSubscription(
            @PathVariable Long id,
            @Valid @RequestBody PriceAlertSubscriptionRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestHeader(value = "X-User-Role", required = false) String headerUserRole) {

        Long userId = resolveUserId(authHeader, headerUserId);
        String userRole = resolveUserRole(authHeader, headerUserRole);

        return ResponseEntity.ok(subscriptionService.updateSubscription(id, request, userId, userRole));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a price alert subscription")
    public ResponseEntity<Void> deleteSubscription(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestHeader(value = "X-User-Role", required = false) String headerUserRole) {

        Long userId = resolveUserId(authHeader, headerUserId);
        String userRole = resolveUserRole(authHeader, headerUserRole);

        subscriptionService.deleteSubscription(id, userId, userRole);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/activate")
    @Operation(summary = "Activate a price alert subscription")
    public ResponseEntity<PriceAlertSubscriptionResponse> activateSubscription(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestHeader(value = "X-User-Role", required = false) String headerUserRole) {

        Long userId = resolveUserId(authHeader, headerUserId);
        String userRole = resolveUserRole(authHeader, headerUserRole);

        return ResponseEntity.ok(subscriptionService.activateSubscription(id, userId, userRole));
    }

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a price alert subscription")
    public ResponseEntity<PriceAlertSubscriptionResponse> deactivateSubscription(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestHeader(value = "X-User-Role", required = false) String headerUserRole) {

        Long userId = resolveUserId(authHeader, headerUserId);
        String userRole = resolveUserRole(authHeader, headerUserRole);

        return ResponseEntity.ok(subscriptionService.deactivateSubscription(id, userId, userRole));
    }

    private Long resolveUserId(String authHeader, Long headerUserId) {
        if (headerUserId != null) return headerUserId;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtService.extractUserId(authHeader.substring(7));
        }
        return 1L;
    }

    private String resolveUserRole(String authHeader, String headerUserRole) {
        if (headerUserRole != null) return headerUserRole;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtService.extractRole(authHeader.substring(7));
        }
        return "DEALER";
    }
}