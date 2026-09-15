package com.cropdeal.delivery.service;

import com.cropdeal.delivery.dto.DeliveryAssignmentRequest;
import com.cropdeal.delivery.dto.DeliveryResponse;
import com.cropdeal.delivery.dto.RefundRequest;
import com.cropdeal.delivery.dto.ReturnRequest;
import com.cropdeal.delivery.dto.UpdateDeliveryStatusRequest;

public interface DeliveryService {

    DeliveryResponse createDelivery(
            DeliveryAssignmentRequest request
    );

    DeliveryResponse getDeliveryById(
            Long deliveryId
    );

    DeliveryResponse getDeliveryByOrderId(
            Long orderId
    );

    DeliveryResponse updateDeliveryStatus(
            Long deliveryId,
            UpdateDeliveryStatusRequest request
    );

    void cancelDelivery(
            Long deliveryId
    );

    DeliveryResponse requestReturn(
            Long deliveryId,
            ReturnRequest request
    );

    DeliveryResponse approveReturn(
            Long deliveryId
    );

    DeliveryResponse rejectReturn(
            Long deliveryId,
            String reason
    );

    DeliveryResponse updateReturnStatus(
            Long deliveryId,
            String status
    );

    DeliveryResponse requestRefund(
            Long deliveryId,
            RefundRequest request
    );

    DeliveryResponse getRefundStatus(
            Long deliveryId
    );
}