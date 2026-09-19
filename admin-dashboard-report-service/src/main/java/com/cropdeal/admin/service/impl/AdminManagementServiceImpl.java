package com.cropdeal.admin.service.impl;

import com.cropdeal.admin.client.CropServiceClient;
import com.cropdeal.admin.client.OrderServiceClient;
import com.cropdeal.admin.client.PaymentServiceClient;
import com.cropdeal.admin.client.UserServiceClient;
import com.cropdeal.admin.dto.client.*;
import com.cropdeal.admin.entity.AdminAuditLog;
import com.cropdeal.admin.repository.AdminAuditLogRepository;
import com.cropdeal.admin.service.AdminManagementService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class AdminManagementServiceImpl implements AdminManagementService {

    private static final Logger log = LoggerFactory.getLogger(AdminManagementServiceImpl.class);

    private final UserServiceClient userServiceClient;
    private final CropServiceClient cropServiceClient;
    private final OrderServiceClient orderServiceClient;
    private final PaymentServiceClient paymentServiceClient;
    private final AdminAuditLogRepository auditLogRepository;

    public AdminManagementServiceImpl(
            UserServiceClient userServiceClient,
            CropServiceClient cropServiceClient,
            OrderServiceClient orderServiceClient,
            PaymentServiceClient paymentServiceClient,
            AdminAuditLogRepository auditLogRepository
    ) {
        this.userServiceClient = userServiceClient;
        this.cropServiceClient = cropServiceClient;
        this.orderServiceClient = orderServiceClient;
        this.paymentServiceClient = paymentServiceClient;
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public List<FarmerClientDto> getAllFarmers() {
        return safeFetch(userServiceClient::getAllFarmers, Collections.emptyList());
    }

    @Override
    public List<DealerClientDto> getAllDealers() {
        return safeFetch(userServiceClient::getAllDealers, Collections.emptyList());
    }

    @Override
    public List<DeliveryPartnerClientDto> getAllDeliveryPartners() {
        return safeFetch(userServiceClient::getAllDeliveryPartners, Collections.emptyList());
    }

    @Override
    public void updateUserStatus(Long userId, boolean active, String reason, String performedBy, String authHeader) {
        userServiceClient.updateUserStatus(userId, new UserStatusUpdateClientRequest(active, reason), authHeader);
        String action = active ? "ACTIVATE_USER" : "DEACTIVATE_USER";
        auditLogRepository.save(new AdminAuditLog(
                action,
                "USER",
                String.valueOf(userId),
                performedBy != null ? performedBy : "admin",
                "Reason: " + (reason != null ? reason : "Administrative decision")
        ));
    }

    @Override
    public List<CropClientDto> getAllCrops() {
        return safeFetch(cropServiceClient::searchCrops, Collections.emptyList());
    }

    @Override
    public void removeCrop(Long cropId, String reason, String performedBy) {
        cropServiceClient.deleteCrop(cropId);
        auditLogRepository.save(new AdminAuditLog(
                "REMOVE_CROP_LISTING",
                "CROP",
                String.valueOf(cropId),
                performedBy != null ? performedBy : "admin",
                "Reason: " + (reason != null ? reason : "Inappropriate or violating listing removed")
        ));
    }

    @Override
    public List<OrderClientDto> getAllOrders() {
        return safeFetch(orderServiceClient::getAllOrders, Collections.emptyList());
    }

    @Override
    public OrderClientDto getOrderById(Long orderId) {
        return orderServiceClient.getOrderById(orderId);
    }

    @Override
    public OrderClientDto updateOrderStatus(Long orderId, String status, String reason, String performedBy) {
        OrderClientDto updated = orderServiceClient.updateOrderStatus(orderId, status);
        auditLogRepository.save(new AdminAuditLog(
                "OVERRIDE_ORDER_STATUS",
                "ORDER",
                String.valueOf(orderId),
                performedBy != null ? performedBy : "admin",
                "New status: " + status + ". Reason: " + (reason != null ? reason : "Administrative override")
        ));
        return updated;
    }

    @Override
    public List<PaymentClientDto> getAllPayments() {
        return safeFetch(paymentServiceClient::getAllPayments, Collections.emptyList());
    }

    @Override
    public PaymentClientDto getPaymentById(Long paymentId) {
        return paymentServiceClient.getPaymentById(paymentId);
    }

    @Override
    public List<AdminAuditLog> getAuditLogs() {
        return auditLogRepository.findTop50ByOrderByTimestampDesc();
    }

    private <T> T safeFetch(java.util.function.Supplier<T> supplier, T fallback) {
        try {
            return supplier.get();
        } catch (Exception e) {
            log.warn("AdminManagementService safeFetch failed: {}", e.getMessage());
            return fallback;
        }
    }
}
