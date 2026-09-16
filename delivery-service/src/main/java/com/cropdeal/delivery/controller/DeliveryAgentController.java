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

    public DeliveryAgentController(
            AssignmentService assignmentService) {

        this.assignmentService = assignmentService;
    }


    // =========================================================
    // AGENT APIs
    // =========================================================

    // GET /api/delivery-agents/available
    // Get all currently available agents
    @GetMapping("/available")
    public ResponseEntity<List<DeliveryAgentResponse>> getAvailableAgents() {

        return ResponseEntity.ok(
                assignmentService.getAvailableAgents()
        );
    }

    // GET /api/delivery-agents/{agentId}
    // Get agent details
    @GetMapping("/{agentId}")
    public ResponseEntity<DeliveryAgentResponse> getAgent(
            @PathVariable Long agentId) {

        return ResponseEntity.ok(
                assignmentService.getAgent(agentId)
        );
    }

    // PUT /api/delivery-agents/{agentId}/availability?available=true
    // Change agent availability
    @PutMapping("/{agentId}/availability")
    public ResponseEntity<DeliveryAgentResponse> updateAvailability(
            @PathVariable Long agentId,
            @RequestParam boolean available) {

        return ResponseEntity.ok(
                assignmentService.updateAvailability(
                        agentId,
                        available
                )
        );
    }

    // PUT /api/delivery-agents/{agentId}/location
    // Update agent current location
    @PutMapping("/{agentId}/location")
    public ResponseEntity<DeliveryAgentResponse> updateLocation(
            @PathVariable Long agentId,
            @RequestParam double latitude,
            @RequestParam double longitude) {

        return ResponseEntity.ok(
                assignmentService.updateLocation(
                        agentId,
                        latitude,
                        longitude
                )
        );
    }


    // =========================================================
    // DELIVERY ASSIGNMENT APIs
    // =========================================================

    // GET /api/delivery-agents/{agentId}/deliveries
    // Get all deliveries assigned to agent
    @GetMapping("/{agentId}/deliveries")
    public ResponseEntity<List<DeliveryResponse>> getAssignedDeliveries(
            @PathVariable Long agentId) {

        return ResponseEntity.ok(
                assignmentService.getAssignedDeliveries(agentId)
        );
    }

    // GET /api/delivery-agents/{agentId}/deliveries/current
    // Get agent's current active delivery
    @GetMapping("/{agentId}/deliveries/current")
    public ResponseEntity<DeliveryResponse> getCurrentDelivery(
            @PathVariable Long agentId) {

        return ResponseEntity.ok(
                assignmentService.getCurrentDelivery(agentId)
        );
    }

    // PUT /api/delivery-agents/{agentId}/deliveries/{deliveryId}/accept
    // Agent accepts delivery assignment
    @PutMapping("/{agentId}/deliveries/{deliveryId}/accept")
    public ResponseEntity<DeliveryResponse> acceptDelivery(
            @PathVariable Long agentId,
            @PathVariable Long deliveryId) {

        return ResponseEntity.ok(
                assignmentService.acceptDelivery(
                        agentId,
                        deliveryId
                )
        );
    }

    // PUT /api/delivery-agents/{agentId}/deliveries/{deliveryId}/reject
    // Agent rejects delivery assignment
    @PutMapping("/{agentId}/deliveries/{deliveryId}/reject")
    public ResponseEntity<DeliveryResponse> rejectDelivery(
            @PathVariable Long agentId,
            @PathVariable Long deliveryId,
            @RequestParam String reason) {

        return ResponseEntity.ok(
                assignmentService.rejectDelivery(
                        agentId,
                        deliveryId,
                        reason
                )
        );
    }


    // =========================================================
    // DELIVERY PROCESS APIs
    // =========================================================

    // PUT /api/delivery-agents/{agentId}/deliveries/{deliveryId}/pickup
    // Agent picks up product from farmer
    @PutMapping("/{agentId}/deliveries/{deliveryId}/pickup")
    public ResponseEntity<DeliveryResponse> pickupDelivery(
            @PathVariable Long agentId,
            @PathVariable Long deliveryId) {

        return ResponseEntity.ok(
                assignmentService.pickupDelivery(
                        agentId,
                        deliveryId
                )
        );
    }

    // PUT /api/delivery-agents/{agentId}/deliveries/{deliveryId}/start
    // Start delivery / mark as IN_TRANSIT
    @PutMapping("/{agentId}/deliveries/{deliveryId}/start")
    public ResponseEntity<DeliveryResponse> startDelivery(
            @PathVariable Long agentId,
            @PathVariable Long deliveryId) {

        return ResponseEntity.ok(
                assignmentService.startDelivery(
                        agentId,
                        deliveryId
                )
        );
    }


    // =========================================================
    // OTP APIs
    // =========================================================

    // POST /api/delivery-agents/{agentId}/deliveries/{deliveryId}/otp
    // Generate OTP and send it to customer's phone
    @PostMapping("/{agentId}/deliveries/{deliveryId}/otp")
    public ResponseEntity<String> sendDeliveryOtp(
            @PathVariable Long agentId,
            @PathVariable Long deliveryId) {

        assignmentService.sendDeliveryOtp(
                agentId,
                deliveryId
        );

        return ResponseEntity.ok(
                "OTP sent successfully to customer"
        );
    }

    // POST /api/delivery-agents/{agentId}/deliveries/{deliveryId}/verify-otp
    // Verify OTP entered by delivery agent
    // Correct OTP -> delivery becomes DELIVERED
    @PostMapping("/{agentId}/deliveries/{deliveryId}/verify-otp")
    public ResponseEntity<DeliveryResponse> verifyDeliveryOtp(
            @PathVariable Long agentId,
            @PathVariable Long deliveryId,
            @RequestParam String otp) {

        return ResponseEntity.ok(
                assignmentService.verifyDeliveryOtp(
                        agentId,
                        deliveryId,
                        otp
                )
        );
    }

    // This replaces directly completing delivery.
    // Delivery should become DELIVERED only after OTP verification.


    // =========================================================
    // RETURN DELIVERY APIs
    // =========================================================

    // PUT /api/delivery-agents/{agentId}/deliveries/{deliveryId}/return-pickup
    // Agent picks up returned product from customer
    @PutMapping(
            "/{agentId}/deliveries/{deliveryId}/return-pickup"
    )
    public ResponseEntity<DeliveryResponse> pickupReturn(
            @PathVariable Long agentId,
            @PathVariable Long deliveryId) {

        return ResponseEntity.ok(
                assignmentService.pickupReturn(
                        agentId,
                        deliveryId
                )
        );
    }

    // PUT /api/delivery-agents/{agentId}/deliveries/{deliveryId}/return-complete
    // Agent completes return and hands product back
    @PutMapping(
            "/{agentId}/deliveries/{deliveryId}/return-complete"
    )
    public ResponseEntity<DeliveryResponse> completeReturn(
            @PathVariable Long agentId,
            @PathVariable Long deliveryId) {

        return ResponseEntity.ok(
                assignmentService.completeReturn(
                        agentId,
                        deliveryId
                )
        );
    }
}