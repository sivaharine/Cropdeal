package com.cropdeal.admin.controller;

import com.cropdeal.admin.dto.client.*;
import com.cropdeal.admin.entity.AdminAuditLog;
import com.cropdeal.admin.service.AdminManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/management")
@Tag(name = "Admin Platform Governance", description = "User, Crop, Order, and Payment Management Operations")
public class AdminManagementController {

    private final AdminManagementService adminManagementService;

    public AdminManagementController(AdminManagementService adminManagementService) {
        this.adminManagementService = adminManagementService;
    }

    // --- User Governance ---
    @GetMapping("/users/farmers")
    @Operation(summary = "View all registered farmers")
    public ResponseEntity<List<FarmerClientDto>> getAllFarmers() {
        return ResponseEntity.ok(adminManagementService.getAllFarmers());
    }

    @GetMapping("/users/dealers")
    @Operation(summary = "View all registered dealers")
    public ResponseEntity<List<DealerClientDto>> getAllDealers() {
        return ResponseEntity.ok(adminManagementService.getAllDealers());
    }

    @GetMapping("/users/delivery-partners")
    @Operation(summary = "View all registered delivery partners")
    public ResponseEntity<List<DeliveryPartnerClientDto>> getAllDeliveryPartners() {
        return ResponseEntity.ok(adminManagementService.getAllDeliveryPartners());
    }

    @PutMapping("/users/{userId}/status")
    @Operation(summary = "Activate or Deactivate user account")
    public ResponseEntity<Map<String, String>> updateUserStatus(
            @PathVariable Long userId,
            @RequestParam boolean active,
            @RequestParam(required = false) String reason,
            @RequestHeader(value = "X-User-Email", required = false) String adminEmail,
            HttpServletRequest request
    ) {
        String authHeader = request.getHeader("Authorization");
        adminManagementService.updateUserStatus(userId, active, reason, adminEmail, authHeader);
        return ResponseEntity.ok(Map.of(
                "message", "User status updated successfully",
                "userId", String.valueOf(userId),
                "active", String.valueOf(active)
        ));
    }

    // --- Crop Governance ---
    @GetMapping("/crops")
    @Operation(summary = "View all crop listings across all farmers")
    public ResponseEntity<List<CropClientDto>> getAllCrops() {
        return ResponseEntity.ok(adminManagementService.getAllCrops());
    }

    @DeleteMapping("/crops/{cropId}")
    @Operation(summary = "Remove or cancel inappropriate crop listing")
    public ResponseEntity<Map<String, String>> removeCrop(
            @PathVariable Long cropId,
            @RequestParam(required = false) String reason,
            @RequestHeader(value = "X-User-Email", required = false) String adminEmail
    ) {
        adminManagementService.removeCrop(cropId, reason, adminEmail);
        return ResponseEntity.ok(Map.of(
                "message", "Crop listing removed successfully",
                "cropId", String.valueOf(cropId)
        ));
    }

    // --- Order Governance ---
    @GetMapping("/orders")
    @Operation(summary = "View all platform orders")
    public ResponseEntity<List<OrderClientDto>> getAllOrders() {
        return ResponseEntity.ok(adminManagementService.getAllOrders());
    }

    @GetMapping("/orders/{orderId}")
    @Operation(summary = "Get specific order details")
    public ResponseEntity<OrderClientDto> getOrderById(@PathVariable Long orderId) {
        return ResponseEntity.ok(adminManagementService.getOrderById(orderId));
    }

    @PatchMapping("/orders/{orderId}/status")
    @Operation(summary = "Admin override for order status")
    public ResponseEntity<OrderClientDto> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam String status,
            @RequestParam(required = false) String reason,
            @RequestHeader(value = "X-User-Email", required = false) String adminEmail
    ) {
        return ResponseEntity.ok(adminManagementService.updateOrderStatus(orderId, status, reason, adminEmail));
    }

    // --- Payment & Transaction Audit ---
    @GetMapping("/payments")
    @Operation(summary = "View all payment transactions")
    public ResponseEntity<List<PaymentClientDto>> getAllPayments() {
        return ResponseEntity.ok(adminManagementService.getAllPayments());
    }

    @GetMapping("/payments/{paymentId}")
    @Operation(summary = "Get specific transaction details")
    public ResponseEntity<PaymentClientDto> getPaymentById(@PathVariable Long paymentId) {
        return ResponseEntity.ok(adminManagementService.getPaymentById(paymentId));
    }

    // --- Audit Log Trail ---
    @GetMapping("/audit-logs")
    @Operation(summary = "View recent administrative action audit trail")
    public ResponseEntity<List<AdminAuditLog>> getAuditLogs() {
        return ResponseEntity.ok(adminManagementService.getAuditLogs());
    }
}
