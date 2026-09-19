package com.cropdeal.delivery.service;

import com.cropdeal.delivery.dto.DeliveryAgentResponse;
import com.cropdeal.delivery.dto.DeliveryResponse;

import java.util.List;

public interface AssignmentService {

    DeliveryAgentResponse getAgent(Long agentId);

    List<DeliveryAgentResponse> getAvailableAgents();

    List<DeliveryResponse> getAssignedDeliveries(Long agentId);

    DeliveryResponse getCurrentDelivery(Long agentId);

    DeliveryResponse acceptDelivery(Long agentId, Long deliveryId);

    DeliveryResponse rejectDelivery(Long agentId, Long deliveryId, String reason);

    DeliveryAgentResponse updateAvailability(Long agentId, boolean available);

    DeliveryAgentResponse updateLocation(Long agentId, double latitude, double longitude);

    DeliveryResponse pickupDelivery(Long agentId, Long deliveryId);

    DeliveryResponse startDelivery(Long agentId, Long deliveryId);

    void sendDeliveryOtp(Long agentId, Long deliveryId);

    DeliveryResponse verifyDeliveryOtp(Long agentId, Long deliveryId, String otp);
}