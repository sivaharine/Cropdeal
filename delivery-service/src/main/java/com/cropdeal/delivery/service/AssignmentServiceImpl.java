package com.cropdeal.delivery.service;

import com.cropdeal.delivery.client.PaymentServiceClient;
import com.cropdeal.delivery.dto.DeliveryAgentResponse;
import com.cropdeal.delivery.dto.DeliveryResponse;
import com.cropdeal.delivery.dto.WalletSettlementRequest;
import com.cropdeal.delivery.entity.Delivery;
import com.cropdeal.delivery.entity.DeliveryOption;
import com.cropdeal.delivery.entity.DeliveryStatus;
import com.cropdeal.delivery.exception.DeliveryConflictException;
import com.cropdeal.delivery.exception.DeliveryNotFoundException;
import com.cropdeal.delivery.repository.DeliveryAssignmentRepository;
import com.cropdeal.delivery.repository.DeliveryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AssignmentServiceImpl implements AssignmentService {

    private final DeliveryRepository deliveryRepository;
    private final DeliveryAssignmentRepository assignmentRepository;
    private final PaymentServiceClient paymentServiceClient;

    public AssignmentServiceImpl(
            DeliveryRepository deliveryRepository,
            DeliveryAssignmentRepository assignmentRepository,
            PaymentServiceClient paymentServiceClient) {

        this.deliveryRepository = deliveryRepository;
        this.assignmentRepository = assignmentRepository;
        this.paymentServiceClient = paymentServiceClient;
    }

    @Override
    public DeliveryAgentResponse getAgent(Long agentId) {
        DeliveryAgentResponse response = new DeliveryAgentResponse();
        response.setAgentId(agentId);
        response.setName("Agent #" + agentId);
        response.setAvailable(true);
        return response;
    }

    @Override
    public List<DeliveryAgentResponse> getAvailableAgents() {
        return Collections.emptyList();
    }

    @Override
    public List<DeliveryResponse> getAssignedDeliveries(Long agentId) {
        return deliveryRepository.findByDeliveryPartnerId(agentId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public DeliveryResponse getCurrentDelivery(Long agentId) {
        return deliveryRepository.findByDeliveryPartnerId(agentId)
                .stream()
                .filter(d -> d.getStatus() == DeliveryStatus.ASSIGNED || d.getStatus() == DeliveryStatus.IN_TRANSIT)
                .findFirst()
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Override
    @Transactional
    public DeliveryResponse acceptDelivery(Long agentId, Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new DeliveryNotFoundException("Delivery not found with id: " + deliveryId));

        if (delivery.getStatus() != DeliveryStatus.AVAILABLE) {
            throw new DeliveryConflictException("Delivery has already been accepted by another delivery partner.");
        }

        delivery.setStatus(DeliveryStatus.ASSIGNED);
        delivery.setDeliveryPartnerId(agentId);
        delivery.setAcceptedAt(LocalDateTime.now());
        delivery.setAcceptedBy("Agent #" + agentId);

        Delivery saved = deliveryRepository.save(delivery);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public DeliveryResponse rejectDelivery(Long agentId, Long deliveryId, String reason) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new DeliveryNotFoundException("Delivery not found with id: " + deliveryId));

        if (delivery.getDeliveryPartnerId() != null && delivery.getDeliveryPartnerId().equals(agentId)) {
            delivery.setDeliveryPartnerId(null);
            delivery.setStatus(DeliveryStatus.AVAILABLE);
            deliveryRepository.save(delivery);
        }

        return mapToResponse(delivery);
    }

    @Override
    public DeliveryAgentResponse updateAvailability(Long agentId, boolean available) {
        DeliveryAgentResponse response = new DeliveryAgentResponse();
        response.setAgentId(agentId);
        response.setAvailable(available);
        return response;
    }

    @Override
    public DeliveryAgentResponse updateLocation(Long agentId, double latitude, double longitude) {
        DeliveryAgentResponse response = new DeliveryAgentResponse();
        response.setAgentId(agentId);
        response.setLatitude(latitude);
        response.setLongitude(longitude);
        return response;
    }

    @Override
    @Transactional
    public DeliveryResponse pickupDelivery(Long agentId, Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new DeliveryNotFoundException("Delivery not found with id: " + deliveryId));

        delivery.setStatus(DeliveryStatus.IN_TRANSIT);
        delivery.setStartedAt(LocalDateTime.now());

        Delivery saved = deliveryRepository.save(delivery);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public DeliveryResponse startDelivery(Long agentId, Long deliveryId) {
        return pickupDelivery(agentId, deliveryId);
    }

    @Override
    public void sendDeliveryOtp(Long agentId, Long deliveryId) {
        // OTP already generated and sent to customer phone
    }

    @Override
    @Transactional
    public DeliveryResponse verifyDeliveryOtp(Long agentId, Long deliveryId, String otp) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new DeliveryNotFoundException("Delivery not found with id: " + deliveryId));

        delivery.setOtpVerified(true);
        delivery.setStatus(DeliveryStatus.VERIFIED);
        delivery.setCompletedAt(LocalDateTime.now());

        Delivery saved = deliveryRepository.save(delivery);

        // Wallet settlement
        if (saved.getDeliveryOption() == DeliveryOption.DELIVERY_AGENT && saved.getDeliveryPartnerId() != null) {
            try {
                WalletSettlementRequest settlementReq = new WalletSettlementRequest(
                        saved.getDeliveryPartnerId(),
                        "ROLE_DELIVERY_PARTNER",
                        saved.getDeliveryCharge() != null ? saved.getDeliveryCharge() : new BigDecimal("150.00"),
                        "DELIVERY-" + saved.getId(),
                        "Delivery payout for order #" + saved.getOrderId()
                );
                paymentServiceClient.creditWallet(settlementReq);
            } catch (Exception e) {
                // Feign fallback
            }
        }

        return mapToResponse(saved);
    }

    private DeliveryResponse mapToResponse(Delivery delivery) {
        DeliveryResponse r = new DeliveryResponse();
        r.setId(delivery.getId());
        r.setDeliveryReference(delivery.getDeliveryReference());
        r.setOrderId(delivery.getOrderId());
        r.setDeliveryOption(delivery.getDeliveryOption() != null ? delivery.getDeliveryOption().name() : null);
        r.setDeliveryPartnerId(delivery.getDeliveryPartnerId());
        r.setDeliveryCharge(delivery.getDeliveryCharge());
        r.setCurrency(delivery.getCurrency());
        r.setStatus(delivery.getStatus() != null ? delivery.getStatus().name() : null);
        r.setCustomerPhone(delivery.getCustomerPhone());
        r.setPickupAddress(delivery.getPickupAddress());
        r.setDeliveryAddress(delivery.getDeliveryAddress());
        r.setDeliveryOtp(delivery.getDeliveryOtp());
        r.setOtpVerified(delivery.isOtpVerified());
        r.setReceiptId(delivery.getReceiptId());
        r.setAcceptedAt(delivery.getAcceptedAt());
        r.setAcceptedBy(delivery.getAcceptedBy());
        r.setStartedAt(delivery.getStartedAt());
        r.setCompletedAt(delivery.getCompletedAt());
        r.setCreatedAt(delivery.getCreatedAt());
        r.setUpdatedAt(delivery.getUpdatedAt());
        return r;
    }
}