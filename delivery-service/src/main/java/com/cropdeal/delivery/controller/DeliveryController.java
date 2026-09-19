package com.cropdeal.delivery.controller;

import com.cropdeal.delivery.dto.*;
import com.cropdeal.delivery.service.DeliveryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deliveries")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @PostMapping
    public ResponseEntity<DeliveryResponse> createDelivery(
            @Valid @RequestBody DeliveryAssignmentRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(deliveryService.createDelivery(request));
    }

    @GetMapping("/available")
    public ResponseEntity<List<DeliveryResponse>> getAvailableDeliveries() {
        return ResponseEntity.ok(deliveryService.getAvailableDeliveries());
    }

    @GetMapping("/my")
    public ResponseEntity<List<DeliveryResponse>> getMyDeliveries(
            @RequestParam(required = false, defaultValue = "1") Long partnerId) {
        return ResponseEntity.ok(deliveryService.getMyDeliveries(partnerId));
    }

    @PostMapping("/{deliveryId}/accept")
    public ResponseEntity<DeliveryResponse> acceptDelivery(
            @PathVariable Long deliveryId,
            @RequestBody(required = false) AcceptDeliveryRequest request) {

        if (request == null) {
            request = new AcceptDeliveryRequest();
            request.setDeliveryPartnerId(1L);
        }
        return ResponseEntity.ok(deliveryService.acceptDelivery(deliveryId, request));
    }

    @PostMapping("/{deliveryId}/verify")
    public ResponseEntity<DeliveryResponse> verifyDelivery(
            @PathVariable Long deliveryId,
            @RequestBody(required = false) VerifyDeliveryRequest request,
            @RequestParam(required = false) Long partnerId) {

        if (request == null) {
            request = new VerifyDeliveryRequest();
        }
        return ResponseEntity.ok(deliveryService.verifyDelivery(deliveryId, request, partnerId));
    }

    @GetMapping("/{deliveryId}")
    public ResponseEntity<DeliveryResponse> getDelivery(
            @PathVariable Long deliveryId,
            @RequestParam(required = false) Long partnerId) {

        return ResponseEntity.ok(deliveryService.getDeliveryById(deliveryId, partnerId));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<DeliveryResponse> getDeliveryByOrder(
            @PathVariable Long orderId) {

        return ResponseEntity.ok(deliveryService.getDeliveryByOrderId(orderId));
    }

    @PutMapping("/{deliveryId}/status")
    public ResponseEntity<DeliveryResponse> updateDeliveryStatus(
            @PathVariable Long deliveryId,
            @Valid @RequestBody UpdateDeliveryStatusRequest request,
            @RequestParam(required = false) Long partnerId) {

        return ResponseEntity.ok(deliveryService.updateDeliveryStatus(deliveryId, request, partnerId));
    }

    @DeleteMapping("/{deliveryId}")
    public ResponseEntity<Void> cancelDelivery(
            @PathVariable Long deliveryId) {

        deliveryService.cancelDelivery(deliveryId);
        return ResponseEntity.noContent().build();
    }
}