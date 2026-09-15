package com.cropdeal.delivery.controller;

import com.cropdeal.delivery.dto.DeliveryAssignmentRequest;
import com.cropdeal.delivery.dto.DeliveryResponse;
import com.cropdeal.delivery.dto.RefundRequest;
import com.cropdeal.delivery.dto.ReturnRequest;
import com.cropdeal.delivery.dto.UpdateDeliveryStatusRequest;
import com.cropdeal.delivery.service.DeliveryService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/deliveries")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    // POST /api/deliveries
    // Create a delivery for an order
    @PostMapping
    public ResponseEntity<DeliveryResponse> createDelivery(
            @Valid @RequestBody DeliveryAssignmentRequest request) {

        DeliveryResponse response =
                deliveryService.createDelivery(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // GET /api/deliveries/{deliveryId}
    // Get delivery details
    @GetMapping("/{deliveryId}")
    public ResponseEntity<DeliveryResponse> getDelivery(
            @PathVariable Long deliveryId) {

        return ResponseEntity.ok(
                deliveryService.getDeliveryById(deliveryId)
        );
    }

    // GET /api/deliveries/order/{orderId}
    // Get delivery using order ID
    @GetMapping("/order/{orderId}")
    public ResponseEntity<DeliveryResponse> getDeliveryByOrder(
            @PathVariable Long orderId) {

        return ResponseEntity.ok(
                deliveryService.getDeliveryByOrderId(orderId)
        );
    }

    // PUT /api/deliveries/{deliveryId}/status
    // Update delivery status
    @PutMapping("/{deliveryId}/status")
    public ResponseEntity<DeliveryResponse> updateDeliveryStatus(
            @PathVariable Long deliveryId,
            @Valid @RequestBody UpdateDeliveryStatusRequest request) {

        return ResponseEntity.ok(
                deliveryService.updateDeliveryStatus(
                        deliveryId,
                        request
                )
        );
    }

    // DELETE /api/deliveries/{deliveryId}
    // Cancel delivery
    @DeleteMapping("/{deliveryId}")
    public ResponseEntity<Void> cancelDelivery(
            @PathVariable Long deliveryId) {

        deliveryService.cancelDelivery(deliveryId);

        return ResponseEntity.noContent().build();
    }


    // =========================================================
    // RETURN APIs
    // =========================================================

    // POST /api/deliveries/{deliveryId}/return
    // Customer requests product return
    @PostMapping("/{deliveryId}/return")
    public ResponseEntity<DeliveryResponse> requestReturn(
            @PathVariable Long deliveryId,
            @Valid @RequestBody ReturnRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        deliveryService.requestReturn(
                                deliveryId,
                                request
                        )
                );
    }

    // PUT /api/deliveries/{deliveryId}/return/approve
    // Approve product return
    @PutMapping("/{deliveryId}/return/approve")
    public ResponseEntity<DeliveryResponse> approveReturn(
            @PathVariable Long deliveryId) {

        return ResponseEntity.ok(
                deliveryService.approveReturn(deliveryId)
        );
    }

    // PUT /api/deliveries/{deliveryId}/return/reject
    // Reject product return
    @PutMapping("/{deliveryId}/return/reject")
    public ResponseEntity<DeliveryResponse> rejectReturn(
            @PathVariable Long deliveryId,
            @RequestParam String reason) {

        return ResponseEntity.ok(
                deliveryService.rejectReturn(
                        deliveryId,
                        reason
                )
        );
    }

    // PUT /api/deliveries/{deliveryId}/return/status
    // Update return status
    @PutMapping("/{deliveryId}/return/status")
    public ResponseEntity<DeliveryResponse> updateReturnStatus(
            @PathVariable Long deliveryId,
            @RequestParam String status) {

        return ResponseEntity.ok(
                deliveryService.updateReturnStatus(
                        deliveryId,
                        status
                )
        );
    }


    // =========================================================
    // REFUND APIs
    // =========================================================

    // POST /api/deliveries/{deliveryId}/refund
    // Request refund after successful return
    @PostMapping("/{deliveryId}/refund")
    public ResponseEntity<DeliveryResponse> requestRefund(
            @PathVariable Long deliveryId,
            @Valid @RequestBody RefundRequest request) {

        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(
                        deliveryService.requestRefund(
                                deliveryId,
                                request
                        )
                );
    }

    // GET /api/deliveries/{deliveryId}/refund
    // Get refund status
    @GetMapping("/{deliveryId}/refund")
    public ResponseEntity<DeliveryResponse> getRefundStatus(
            @PathVariable Long deliveryId) {

        return ResponseEntity.ok(
                deliveryService.getRefundStatus(deliveryId)
        );
    }
}