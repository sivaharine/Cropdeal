package com.cropdeal.delivery.service;

import com.cropdeal.delivery.dto.DeliveryAgentResponse;
import com.cropdeal.delivery.dto.DeliveryResponse;
import com.cropdeal.delivery.entity.AssignmentStatus;
import com.cropdeal.delivery.entity.Delivery;
import com.cropdeal.delivery.entity.DeliveryAssignment;
import com.cropdeal.delivery.entity.DeliveryStatus;
import com.cropdeal.delivery.entity.ReturnStatus;
import com.cropdeal.delivery.exception.DeliveryNotFoundException;
import com.cropdeal.delivery.repository.DeliveryAssignmentRepository;
import com.cropdeal.delivery.repository.DeliveryRepository;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class AssignmentServiceImpl
        implements AssignmentService {

    private final DeliveryRepository deliveryRepository;
    private final DeliveryAssignmentRepository assignmentRepository;
    private final RestClient restClient;

    public AssignmentServiceImpl(
            DeliveryRepository deliveryRepository,
            DeliveryAssignmentRepository assignmentRepository,
            RestClient.Builder restClientBuilder) {

        this.deliveryRepository = deliveryRepository;
        this.assignmentRepository = assignmentRepository;

        this.restClient = restClientBuilder
                .baseUrl("http://notification-service")
                .build();
    }

    @Override
    public DeliveryAgentResponse getAgent(
            Long agentId) {

        // Agent profile can be obtained from User Service.
        // This is a placeholder response for now.

        DeliveryAgentResponse response =
                new DeliveryAgentResponse();

        response.setAgentId(agentId);

        return response;
    }

    @Override
    public List<DeliveryAgentResponse> getAvailableAgents() {

        // Normally this data should come from User Service.
        return List.of();
    }

    @Override
    public List<DeliveryResponse> getAssignedDeliveries(
            Long agentId) {

        List<Delivery> deliveries =
                deliveryRepository
                        .findByDeliveryAgentId(agentId);

        return deliveries.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public DeliveryResponse getCurrentDelivery(
            Long agentId) {

        Delivery delivery =
                deliveryRepository
                        .findFirstByDeliveryAgentIdAndStatusIn(
                                agentId,
                                List.of(
                                        DeliveryStatus.ACCEPTED,
                                        DeliveryStatus.PICKED_UP,
                                        DeliveryStatus.IN_TRANSIT
                                )
                        )
                        .orElseThrow(
                                () -> new DeliveryNotFoundException(
                                        "No active delivery found"
                                )
                        );

        return mapToResponse(delivery);
    }

    @Override
    public DeliveryResponse acceptDelivery(
            Long agentId,
            Long deliveryId) {

        Delivery delivery =
                getDelivery(deliveryId);

        validateAgent(
                delivery,
                agentId
        );

        delivery.setStatus(
                DeliveryStatus.ACCEPTED
        );

        DeliveryAssignment assignment =
                assignmentRepository
                        .findByDeliveryIdAndDeliveryAgentId(
                                deliveryId,
                                agentId
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Assignment not found"
                                )
                        );

        assignment.setStatus(
                AssignmentStatus.ACCEPTED
        );

        assignmentRepository.save(assignment);

        return mapToResponse(
                deliveryRepository.save(delivery)
        );
    }

    @Override
    public DeliveryResponse rejectDelivery(
            Long agentId,
            Long deliveryId,
            String reason) {

        Delivery delivery =
                getDelivery(deliveryId);

        validateAgent(
                delivery,
                agentId
        );

        DeliveryAssignment assignment =
                assignmentRepository
                        .findByDeliveryIdAndDeliveryAgentId(
                                deliveryId,
                                agentId
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Assignment not found"
                                )
                        );

        assignment.setStatus(
                AssignmentStatus.REJECTED
        );

        assignment.setRejectionReason(reason);

        assignmentRepository.save(assignment);

        delivery.setStatus(
                DeliveryStatus.CREATED
        );

        return mapToResponse(
                deliveryRepository.save(delivery)
        );
    }

    @Override
    public DeliveryAgentResponse updateAvailability(
            Long agentId,
            boolean available) {

        // This normally calls User Service to update
        // DeliveryAgentProfile availability.

        DeliveryAgentResponse response =
                new DeliveryAgentResponse();

        response.setAgentId(agentId);
        response.setAvailable(available);

        return response;
    }

    @Override
    public DeliveryAgentResponse updateLocation(
            Long agentId,
            double latitude,
            double longitude) {

        // Normally save/update this in delivery-agent profile
        // or a dedicated tracking store.

        DeliveryAgentResponse response =
                new DeliveryAgentResponse();

        response.setAgentId(agentId);
        response.setLatitude(latitude);
        response.setLongitude(longitude);

        return response;
    }

    @Override
    public DeliveryResponse pickupDelivery(
            Long agentId,
            Long deliveryId) {

        Delivery delivery =
                getDelivery(deliveryId);

        validateAgent(
                delivery,
                agentId
        );

        if (delivery.getStatus()
                != DeliveryStatus.ACCEPTED) {

            throw new IllegalStateException(
                    "Delivery must be accepted before pickup"
            );
        }

        delivery.setStatus(
                DeliveryStatus.PICKED_UP
        );

        return mapToResponse(
                deliveryRepository.save(delivery)
        );
    }

    @Override
    public DeliveryResponse startDelivery(
            Long agentId,
            Long deliveryId) {

        Delivery delivery =
                getDelivery(deliveryId);

        validateAgent(
                delivery,
                agentId
        );

        if (delivery.getStatus()
                != DeliveryStatus.PICKED_UP) {

            throw new IllegalStateException(
                    "Product must be picked up first"
            );
        }

        delivery.setStatus(
                DeliveryStatus.IN_TRANSIT
        );

        return mapToResponse(
                deliveryRepository.save(delivery)
        );
    }

    @Override
    public void sendDeliveryOtp(
            Long agentId,
            Long deliveryId) {

        Delivery delivery =
                getDelivery(deliveryId);

        validateAgent(
                delivery,
                agentId
        );

        if (delivery.getStatus()
                != DeliveryStatus.IN_TRANSIT) {

            throw new IllegalStateException(
                    "OTP can be generated only when delivery is in transit"
            );
        }

        String otp =
                String.valueOf(
                        ThreadLocalRandom.current()
                                .nextInt(100000, 1000000)
                );

        delivery.setDeliveryOtp(otp);
        delivery.setOtpVerified(false);

        deliveryRepository.save(delivery);

        /*
         * REST call to Notification Service.
         *
         * Example:
         * POST /api/notifications/delivery-otp
         */
        restClient.post()
                .uri("/api/notifications/delivery-otp")
                .body(
                        new OtpRequest(
                                delivery.getCustomerPhone(),
                                otp
                        )
                )
                .retrieve()
                .toBodilessEntity();
    }

    @Override
    public DeliveryResponse verifyDeliveryOtp(
            Long agentId,
            Long deliveryId,
            String otp) {

        Delivery delivery =
                getDelivery(deliveryId);

        validateAgent(
                delivery,
                agentId
        );

        if (delivery.getDeliveryOtp() == null) {
            throw new IllegalStateException(
                    "OTP has not been generated"
            );
        }

        if (!delivery.getDeliveryOtp().equals(otp)) {
            throw new IllegalArgumentException(
                    "Invalid OTP"
            );
        }

        delivery.setOtpVerified(true);
        delivery.setDeliveryOtp(null);

        delivery.setStatus(
                DeliveryStatus.DELIVERED
        );

        Delivery saved =
                deliveryRepository.save(delivery);

        /*
         * Notify customer that order has been delivered.
         */
        restClient.post()
                .uri("/api/notifications/delivery-completed")
                .body(
                        new DeliveryCompletedRequest(
                                delivery.getCustomerPhone(),
                                delivery.getOrderId()
                        )
                )
                .retrieve()
                .toBodilessEntity();

        return mapToResponse(saved);
    }

    @Override
    public DeliveryResponse pickupReturn(
            Long agentId,
            Long deliveryId) {

        Delivery delivery =
                getDelivery(deliveryId);

        validateAgent(
                delivery,
                agentId
        );

        if (delivery.getReturnStatus()
                != ReturnStatus.RETURN_APPROVED) {

            throw new IllegalStateException(
                    "Return is not approved"
            );
        }

        delivery.setReturnStatus(
                ReturnStatus.RETURN_PICKED_UP
        );

        return mapToResponse(
                deliveryRepository.save(delivery)
        );
    }

    @Override
    public DeliveryResponse completeReturn(
            Long agentId,
            Long deliveryId) {

        Delivery delivery =
                getDelivery(deliveryId);

        validateAgent(
                delivery,
                agentId
        );

        if (delivery.getReturnStatus()
                != ReturnStatus.RETURN_PICKED_UP) {

            throw new IllegalStateException(
                    "Return product must be picked up first"
            );
        }

        delivery.setReturnStatus(
                ReturnStatus.RETURN_COMPLETED
        );

        return mapToResponse(
                deliveryRepository.save(delivery)
        );
    }

    private Delivery getDelivery(
            Long deliveryId) {

        return deliveryRepository.findById(deliveryId)
                .orElseThrow(
                        () -> new DeliveryNotFoundException(
                                "Delivery not found: "
                                        + deliveryId
                        )
                );
    }

    private void validateAgent(
            Delivery delivery,
            Long agentId) {

        if (!agentId.equals(
                delivery.getDeliveryAgentId())) {

            throw new IllegalArgumentException(
                    "Agent is not assigned to this delivery"
            );
        }
    }

    private DeliveryResponse mapToResponse(
            Delivery delivery) {

        DeliveryResponse response =
                new DeliveryResponse();

        response.setDeliveryId(
                delivery.getId()
        );

        response.setOrderId(
                delivery.getOrderId()
        );

        response.setDeliveryAgentId(
                delivery.getDeliveryAgentId()
        );

        response.setPickupAddress(
                delivery.getPickupAddress()
        );

        response.setDeliveryAddress(
                delivery.getDeliveryAddress()
        );

        response.setStatus(
                delivery.getStatus().name()
        );

        response.setOtpVerified(
                delivery.isOtpVerified()
        );

        response.setReturnStatus(
                delivery.getReturnStatus().name()
        );

        response.setRefundStatus(
                delivery.getRefundStatus().name()
        );

        response.setCreatedAt(
                delivery.getCreatedAt()
        );

        response.setUpdatedAt(
                delivery.getUpdatedAt()
        );

        return response;
    }

    // Small request classes for Notification Service communication

    private record OtpRequest(
            String phoneNumber,
            String otp
    ) {
    }

    private record DeliveryCompletedRequest(
            String phoneNumber,
            Long orderId
    ) {
    }
}
