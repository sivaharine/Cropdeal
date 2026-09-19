package com.cropdeal.delivery.controller;

import com.cropdeal.delivery.dto.DeliveryAgentResponse;
import com.cropdeal.delivery.dto.DeliveryResponse;
import com.cropdeal.delivery.service.AssignmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery-agents")
public class DeliveryAgentController {

    private final AssignmentService assignmentService;

    public DeliveryAgentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @GetMapping("/available")
    public ResponseEntity<List<DeliveryAgentResponse>> getAvailableAgents() {
        return ResponseEntity.ok(assignmentService.getAvailableAgents());
    }

    @GetMapping("/{agentId}")
    public ResponseEntity<DeliveryAgentResponse> getAgent(@PathVariable Long agentId) {
        return ResponseEntity.ok(assignmentService.getAgent(agentId));
    }

    @PutMapping("/{agentId}/availability")
    public ResponseEntity<DeliveryAgentResponse> updateAvailability(
            @PathVariable Long agentId,
            @RequestParam boolean available) {
        return ResponseEntity.ok(assignmentService.updateAvailability(agentId, available));
    }

    @PutMapping("/{agentId}/location")
    public ResponseEntity<DeliveryAgentResponse> updateLocation(
            @PathVariable Long agentId,
            @RequestParam double latitude,
            @RequestParam double longitude) {
        return ResponseEntity.ok(assignmentService.updateLocation(agentId, latitude, longitude));
    }

    @GetMapping("/{agentId}/deliveries")
    public ResponseEntity<List<DeliveryResponse>> getAssignedDeliveries(@PathVariable Long agentId) {
        return ResponseEntity.ok(assignmentService.getAssignedDeliveries(agentId));
    }

    @GetMapping("/{agentId}/deliveries/current")
    public ResponseEntity<DeliveryResponse> getCurrentDelivery(@PathVariable Long agentId) {
        return ResponseEntity.ok(assignmentService.getCurrentDelivery(agentId));
    }

    @PutMapping("/{agentId}/deliveries/{deliveryId}/accept")
    public ResponseEntity<DeliveryResponse> acceptDelivery(
            @PathVariable Long agentId,
            @PathVariable Long deliveryId) {
        return ResponseEntity.ok(assignmentService.acceptDelivery(agentId, deliveryId));
    }

    @PutMapping("/{agentId}/deliveries/{deliveryId}/reject")
    public ResponseEntity<DeliveryResponse> rejectDelivery(
            @PathVariable Long agentId,
            @PathVariable Long deliveryId,
            @RequestParam String reason) {
        return ResponseEntity.ok(assignmentService.rejectDelivery(agentId, deliveryId, reason));
    }

    @PutMapping("/{agentId}/deliveries/{deliveryId}/pickup")
    public ResponseEntity<DeliveryResponse> pickupDelivery(
            @PathVariable Long agentId,
            @PathVariable Long deliveryId) {
        return ResponseEntity.ok(assignmentService.pickupDelivery(agentId, deliveryId));
    }

    @PutMapping("/{agentId}/deliveries/{deliveryId}/start")
    public ResponseEntity<DeliveryResponse> startDelivery(
            @PathVariable Long agentId,
            @PathVariable Long deliveryId) {
        return ResponseEntity.ok(assignmentService.startDelivery(agentId, deliveryId));
    }

    @PostMapping("/{agentId}/deliveries/{deliveryId}/otp")
    public ResponseEntity<String> sendDeliveryOtp(
            @PathVariable Long agentId,
            @PathVariable Long deliveryId) {
        assignmentService.sendDeliveryOtp(agentId, deliveryId);
        return ResponseEntity.ok("OTP sent successfully to customer");
    }

    @PostMapping("/{agentId}/deliveries/{deliveryId}/verify-otp")
    public ResponseEntity<DeliveryResponse> verifyDeliveryOtp(
            @PathVariable Long agentId,
            @PathVariable Long deliveryId,
            @RequestParam String otp) {
        return ResponseEntity.ok(assignmentService.verifyDeliveryOtp(agentId, deliveryId, otp));
    }
}