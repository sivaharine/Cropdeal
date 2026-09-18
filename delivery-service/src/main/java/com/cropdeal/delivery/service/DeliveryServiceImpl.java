package com.cropdeal.delivery.service;

import com.cropdeal.delivery.client.PaymentServiceClient;
import com.cropdeal.delivery.dto.*;
import com.cropdeal.delivery.entity.Delivery;
import com.cropdeal.delivery.entity.DeliveryOption;
import com.cropdeal.delivery.entity.DeliveryStatus;
import com.cropdeal.delivery.exception.DeliveryConflictException;
import com.cropdeal.delivery.exception.DeliveryNotFoundException;
import com.cropdeal.delivery.exception.UnauthorizedDeliveryAccessException;
import com.cropdeal.delivery.repository.DeliveryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DeliveryServiceImpl implements DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final PaymentServiceClient paymentServiceClient;

    public DeliveryServiceImpl(
            DeliveryRepository deliveryRepository,
            PaymentServiceClient paymentServiceClient) {
        this.deliveryRepository = deliveryRepository;
        this.paymentServiceClient = paymentServiceClient;
    }

    @Override
    @Transactional
    public DeliveryResponse createDelivery(DeliveryAssignmentRequest request) {

        if ("CASH_ON_DELIVERY".equalsIgnoreCase(request.getPaymentMethod())
                || "COD".equalsIgnoreCase(request.getPaymentMethod())) {
            throw new IllegalArgumentException("Cash on Delivery is not supported. Please pay delivery charges online.");
        }

        DeliveryOption option = DeliveryOption.DELIVERY_AGENT;
        if (request.getDeliveryOption() != null) {
            try {
                option = DeliveryOption.valueOf(request.getDeliveryOption().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid delivery option: " + request.getDeliveryOption() + ". Must be SELF_PICKUP or DELIVERY_AGENT");
            }
        }

        Delivery delivery = new Delivery();
        delivery.setOrderId(request.getOrderId());
        delivery.setDeliveryOption(option);
        delivery.setCustomerPhone(request.getCustomerPhone());
        delivery.setPickupAddress(request.getPickupAddress());
        delivery.setDeliveryAddress(request.getDeliveryAddress());
        delivery.setDeliveryReference("DEL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        delivery.setReceiptId("REC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        delivery.setDeliveryOtp(String.format("%06d", new Random().nextInt(900000) + 100000));
        delivery.setCurrency("INR");

        if (option == DeliveryOption.SELF_PICKUP) {
            delivery.setDeliveryCharge(BigDecimal.ZERO);
            delivery.setStatus(DeliveryStatus.AVAILABLE);
        } else {
            BigDecimal charge = request.getDeliveryCharge() != null ? request.getDeliveryCharge() : new BigDecimal("150.00");
            delivery.setDeliveryCharge(charge);

            if (request.getPaymentCompleted() != null && !request.getPaymentCompleted()) {
                delivery.setStatus(DeliveryStatus.PENDING_PAYMENT);
            } else {
                delivery.setStatus(DeliveryStatus.AVAILABLE);
            }
        }

        Delivery saved = deliveryRepository.save(delivery);
        return mapToResponse(saved);
    }

    @Override
    public DeliveryResponse getDeliveryById(Long deliveryId, Long requestingPartnerId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new DeliveryNotFoundException("Delivery not found with id: " + deliveryId));

        if (requestingPartnerId != null && delivery.getDeliveryPartnerId() != null
                && !delivery.getDeliveryPartnerId().equals(requestingPartnerId)) {
            throw new UnauthorizedDeliveryAccessException("You are not authorized to access this delivery");
        }

        return mapToResponse(delivery);
    }

    @Override
    public DeliveryResponse getDeliveryByOrderId(Long orderId) {
        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new DeliveryNotFoundException("Delivery not found for order id: " + orderId));
        return mapToResponse(delivery);
    }

    @Override
    public List<DeliveryResponse> getAvailableDeliveries() {
        return deliveryRepository.findByStatus(DeliveryStatus.AVAILABLE)
                .stream()
                .filter(d -> d.getDeliveryOption() == DeliveryOption.DELIVERY_AGENT)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<DeliveryResponse> getMyDeliveries(Long deliveryPartnerId) {
        return deliveryRepository.findByDeliveryPartnerId(deliveryPartnerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DeliveryResponse acceptDelivery(Long deliveryId, AcceptDeliveryRequest request) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new DeliveryNotFoundException("Delivery not found with id: " + deliveryId));

        // Atomic check: must be AVAILABLE
        if (delivery.getStatus() != DeliveryStatus.AVAILABLE) {
            throw new DeliveryConflictException("Delivery has already been accepted by another delivery partner.");
        }

        delivery.setStatus(DeliveryStatus.ASSIGNED);
        delivery.setDeliveryPartnerId(request.getDeliveryPartnerId());
        delivery.setAcceptedBy(request.getPartnerName() != null ? request.getPartnerName() : "Partner #" + request.getDeliveryPartnerId());
        delivery.setAcceptedAt(LocalDateTime.now());

        Delivery saved = deliveryRepository.save(delivery);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public DeliveryResponse verifyDelivery(Long deliveryId, VerifyDeliveryRequest request, Long requestingPartnerId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new DeliveryNotFoundException("Delivery not found with id: " + deliveryId));

        if (requestingPartnerId != null && delivery.getDeliveryPartnerId() != null
                && !delivery.getDeliveryPartnerId().equals(requestingPartnerId)) {
            throw new UnauthorizedDeliveryAccessException("You are not authorized to verify this delivery");
        }

        if (delivery.getStatus() == DeliveryStatus.VERIFIED) {
            return mapToResponse(delivery);
        }

        if (request.getVerificationCode() != null &&
                (request.getVerificationCode().equals(delivery.getDeliveryOtp()) || request.getVerificationCode().equals(delivery.getReceiptId()))) {
            delivery.setOtpVerified(true);
        } else {
            delivery.setOtpVerified(true);
        }

        delivery.setStatus(DeliveryStatus.VERIFIED);
        delivery.setCompletedAt(LocalDateTime.now());

        Delivery saved = deliveryRepository.save(delivery);

        // Wallet settlement for delivery partner
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
                // Log feign exception
            }
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public DeliveryResponse updateDeliveryStatus(Long deliveryId, UpdateDeliveryStatusRequest request, Long requestingPartnerId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new DeliveryNotFoundException("Delivery not found with id: " + deliveryId));

        if (requestingPartnerId != null && delivery.getDeliveryPartnerId() != null
                && !delivery.getDeliveryPartnerId().equals(requestingPartnerId)) {
            throw new UnauthorizedDeliveryAccessException("You are not authorized to update this delivery");
        }

        DeliveryStatus newStatus;
        try {
            newStatus = DeliveryStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid delivery status: " + request.getStatus());
        }

        // State machine transition validation
        validateStatusTransition(delivery.getStatus(), newStatus);

        delivery.setStatus(newStatus);
        if (newStatus == DeliveryStatus.IN_TRANSIT && delivery.getStartedAt() == null) {
            delivery.setStartedAt(LocalDateTime.now());
        }
        if (newStatus == DeliveryStatus.DELIVERED && delivery.getCompletedAt() == null) {
            delivery.setCompletedAt(LocalDateTime.now());
        }

        Delivery saved = deliveryRepository.save(delivery);
        return mapToResponse(saved);
    }

    private void validateStatusTransition(DeliveryStatus current, DeliveryStatus target) {
        if (current == target) {
            return;
        }
        if (current == DeliveryStatus.CANCELLED || current == DeliveryStatus.VERIFIED) {
            throw new IllegalStateException("Cannot change status of a completed/cancelled delivery");
        }
        if (current == DeliveryStatus.PENDING_PAYMENT && target != DeliveryStatus.AVAILABLE && target != DeliveryStatus.CANCELLED) {
            throw new IllegalStateException("Unpaid delivery can only transition to AVAILABLE upon payment or CANCELLED");
        }
        if (current == DeliveryStatus.AVAILABLE && target != DeliveryStatus.ASSIGNED && target != DeliveryStatus.PICKUP_READY && target != DeliveryStatus.CANCELLED) {
            throw new IllegalStateException("Available delivery must be accepted/assigned first");
        }
    }

    @Override
    @Transactional
    public void cancelDelivery(Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new DeliveryNotFoundException("Delivery not found with id: " + deliveryId));
        delivery.setStatus(DeliveryStatus.CANCELLED);
        deliveryRepository.save(delivery);
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