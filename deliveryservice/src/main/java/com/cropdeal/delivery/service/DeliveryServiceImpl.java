package com.cropdeal.delivery.service;

import com.cropdeal.delivery.dto.DeliveryAssignmentRequest;
import com.cropdeal.delivery.dto.DeliveryResponse;
import com.cropdeal.delivery.dto.RefundRequest;
import com.cropdeal.delivery.dto.ReturnRequest;
import com.cropdeal.delivery.dto.UpdateDeliveryStatusRequest;
import com.cropdeal.delivery.entity.AssignmentStatus;
import com.cropdeal.delivery.entity.Delivery;
import com.cropdeal.delivery.entity.DeliveryAssignment;
import com.cropdeal.delivery.entity.DeliveryStatus;
import com.cropdeal.delivery.entity.DeliveryStatusHistory;
import com.cropdeal.delivery.entity.RefundStatus;
import com.cropdeal.delivery.entity.ReturnStatus;
import com.cropdeal.delivery.exception.DeliveryNotFoundException;
import com.cropdeal.delivery.repository.DeliveryAssignmentRepository;
import com.cropdeal.delivery.repository.DeliveryRepository;
import com.cropdeal.delivery.repository.DeliveryStatusHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DeliveryServiceImpl implements DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final DeliveryAssignmentRepository assignmentRepository;
    private final DeliveryStatusHistoryRepository statusHistoryRepository;

    public DeliveryServiceImpl(
            DeliveryRepository deliveryRepository,
            DeliveryAssignmentRepository assignmentRepository,
            DeliveryStatusHistoryRepository statusHistoryRepository) {

        this.deliveryRepository = deliveryRepository;
        this.assignmentRepository = assignmentRepository;
        this.statusHistoryRepository = statusHistoryRepository;
    }

    @Override
    public DeliveryResponse createDelivery(
            DeliveryAssignmentRequest request) {

        Delivery delivery = new Delivery();
        delivery.setOrderId(request.getOrderId());
        delivery.setDeliveryAgentId(request.getDeliveryAgentId());
        delivery.setPickupAddress(request.getPickupAddress());
        delivery.setDeliveryAddress(request.getDeliveryAddress());
        delivery.setStatus(DeliveryStatus.ASSIGNED);

        Delivery savedDelivery = deliveryRepository.save(delivery);

        DeliveryAssignment assignment = new DeliveryAssignment();
        assignment.setDeliveryId(savedDelivery.getId());
        assignment.setDeliveryAgentId(request.getDeliveryAgentId());
        assignment.setStatus(AssignmentStatus.ASSIGNED);
        assignmentRepository.save(assignment);

        saveStatusHistory(
                savedDelivery,
                "Delivery created and assigned"
        );

        return mapToResponse(savedDelivery);
    }

    @Override
    @Transactional(readOnly = true)
    public DeliveryResponse getDeliveryById(
            Long deliveryId) {

        return mapToResponse(getDelivery(deliveryId));
    }

    @Override
    @Transactional(readOnly = true)
    public DeliveryResponse getDeliveryByOrderId(
            Long orderId) {

        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(
                        () -> new DeliveryNotFoundException(
                                "Delivery not found for order: " + orderId
                        )
                );

        return mapToResponse(delivery);
    }

    @Override
    public DeliveryResponse updateDeliveryStatus(
            Long deliveryId,
            UpdateDeliveryStatusRequest request) {

        Delivery delivery = getDelivery(deliveryId);
        DeliveryStatus status = parseEnum(
                DeliveryStatus.class,
                request.getStatus(),
                "Invalid delivery status"
        );

        delivery.setStatus(status);

        Delivery saved = deliveryRepository.save(delivery);
        saveStatusHistory(saved, "Delivery status updated");

        return mapToResponse(saved);
    }

    @Override
    public void cancelDelivery(
            Long deliveryId) {

        Delivery delivery = getDelivery(deliveryId);
        delivery.setStatus(DeliveryStatus.CANCELLED);

        Delivery saved = deliveryRepository.save(delivery);
        saveStatusHistory(saved, "Delivery cancelled");
    }

    @Override
    public DeliveryResponse requestReturn(
            Long deliveryId,
            ReturnRequest request) {

        Delivery delivery = getDelivery(deliveryId);
        delivery.setReturnStatus(ReturnStatus.RETURN_REQUESTED);

        Delivery saved = deliveryRepository.save(delivery);
        saveStatusHistory(saved, "Return requested: " + request.getReason());

        return mapToResponse(saved);
    }

    @Override
    public DeliveryResponse approveReturn(
            Long deliveryId) {

        Delivery delivery = getDelivery(deliveryId);
        delivery.setReturnStatus(ReturnStatus.RETURN_APPROVED);

        return mapToResponse(deliveryRepository.save(delivery));
    }

    @Override
    public DeliveryResponse rejectReturn(
            Long deliveryId,
            String reason) {

        Delivery delivery = getDelivery(deliveryId);
        delivery.setReturnStatus(ReturnStatus.RETURN_REJECTED);

        Delivery saved = deliveryRepository.save(delivery);
        saveStatusHistory(saved, "Return rejected: " + reason);

        return mapToResponse(saved);
    }

    @Override
    public DeliveryResponse updateReturnStatus(
            Long deliveryId,
            String status) {

        Delivery delivery = getDelivery(deliveryId);
        ReturnStatus returnStatus = parseEnum(
                ReturnStatus.class,
                status,
                "Invalid return status"
        );

        delivery.setReturnStatus(returnStatus);

        return mapToResponse(deliveryRepository.save(delivery));
    }

    @Override
    public DeliveryResponse requestRefund(
            Long deliveryId,
            RefundRequest request) {

        Delivery delivery = getDelivery(deliveryId);

        if (!delivery.getOrderId().equals(request.getOrderId())) {
            throw new IllegalArgumentException(
                    "Refund order id does not match delivery order id"
            );
        }

        if (delivery.getReturnStatus() != ReturnStatus.RETURN_COMPLETED) {
            throw new IllegalStateException(
                    "Refund can be requested only after return is completed"
            );
        }

        delivery.setRefundStatus(RefundStatus.REFUND_REQUESTED);

        return mapToResponse(deliveryRepository.save(delivery));
    }

    @Override
    @Transactional(readOnly = true)
    public DeliveryResponse getRefundStatus(
            Long deliveryId) {

        return mapToResponse(getDelivery(deliveryId));
    }

    private Delivery getDelivery(
            Long deliveryId) {

        return deliveryRepository.findById(deliveryId)
                .orElseThrow(
                        () -> new DeliveryNotFoundException(
                                "Delivery not found: " + deliveryId
                        )
                );
    }

    private void saveStatusHistory(
            Delivery delivery,
            String remarks) {

        DeliveryStatusHistory history = new DeliveryStatusHistory();
        history.setDeliveryId(delivery.getId());
        history.setStatus(delivery.getStatus());
        history.setUpdatedByAgentId(delivery.getDeliveryAgentId());
        history.setRemarks(remarks);

        statusHistoryRepository.save(history);
    }

    private DeliveryResponse mapToResponse(
            Delivery delivery) {

        DeliveryResponse response = new DeliveryResponse();
        response.setDeliveryId(delivery.getId());
        response.setOrderId(delivery.getOrderId());
        response.setDeliveryAgentId(delivery.getDeliveryAgentId());
        response.setPickupAddress(delivery.getPickupAddress());
        response.setDeliveryAddress(delivery.getDeliveryAddress());
        response.setStatus(delivery.getStatus().name());
        response.setOtpVerified(delivery.isOtpVerified());
        response.setReturnStatus(delivery.getReturnStatus().name());
        response.setRefundStatus(delivery.getRefundStatus().name());
        response.setCreatedAt(delivery.getCreatedAt());
        response.setUpdatedAt(delivery.getUpdatedAt());

        return response;
    }

    private <T extends Enum<T>> T parseEnum(
            Class<T> enumType,
            String value,
            String errorMessage) {

        try {
            return Enum.valueOf(
                    enumType,
                    value.trim().toUpperCase()
            );
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    errorMessage + ": " + value
            );
        }
    }
}
