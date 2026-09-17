package com.cropdeal.delivery.service;

import com.cropdeal.delivery.dto.*;
import java.util.List;

public interface DeliveryService {

    DeliveryResponse createDelivery(DeliveryAssignmentRequest request);

    DeliveryResponse getDeliveryById(Long deliveryId, Long requestingPartnerId);

    DeliveryResponse getDeliveryByOrderId(Long orderId);

    List<DeliveryResponse> getAvailableDeliveries();

    List<DeliveryResponse> getMyDeliveries(Long deliveryPartnerId);

    DeliveryResponse acceptDelivery(Long deliveryId, AcceptDeliveryRequest request);

    DeliveryResponse verifyDelivery(Long deliveryId, VerifyDeliveryRequest request, Long requestingPartnerId);

    DeliveryResponse updateDeliveryStatus(Long deliveryId, UpdateDeliveryStatusRequest request, Long requestingPartnerId);

    void cancelDelivery(Long deliveryId);
}