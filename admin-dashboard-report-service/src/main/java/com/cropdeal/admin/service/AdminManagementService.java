package com.cropdeal.admin.service;

import com.cropdeal.admin.dto.client.*;
import com.cropdeal.admin.entity.AdminAuditLog;

import java.util.List;

public interface AdminManagementService {
    List<FarmerClientDto> getAllFarmers();
    List<DealerClientDto> getAllDealers();
    List<DeliveryPartnerClientDto> getAllDeliveryPartners();
    void updateUserStatus(Long userId, boolean active, String reason, String performedBy, String authHeader);

    List<CropClientDto> getAllCrops();
    void removeCrop(Long cropId, String reason, String performedBy);

    List<OrderClientDto> getAllOrders();
    OrderClientDto getOrderById(Long orderId);
    OrderClientDto updateOrderStatus(Long orderId, String status, String reason, String performedBy);

    List<PaymentClientDto> getAllPayments();
    PaymentClientDto getPaymentById(Long paymentId);

    List<AdminAuditLog> getAuditLogs();
}
