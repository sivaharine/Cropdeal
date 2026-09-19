package com.cropdeal.admin.controller;

import com.cropdeal.admin.dto.DashboardSummaryResponse;
import com.cropdeal.admin.dto.OrdersByStatusResponse;
import com.cropdeal.admin.dto.RevenueSummaryResponse;
import com.cropdeal.admin.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@Tag(name = "Admin Dashboard", description = "Real-time Platform KPI & Analytics Endpoints")
public class AdminDashboardController {

    private final DashboardService dashboardService;

    public AdminDashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Get high-level platform KPI summary across all microservices")
    public ResponseEntity<DashboardSummaryResponse> getSummary() {
        return ResponseEntity.ok(dashboardService.getSummary());
    }

    @GetMapping("/analytics/orders-by-status")
    @Operation(summary = "Get order distribution breakdown by status")
    public ResponseEntity<OrdersByStatusResponse> getOrdersByStatus() {
        return ResponseEntity.ok(dashboardService.getOrdersByStatus());
    }

    @GetMapping("/analytics/revenue")
    @Operation(summary = "Get revenue summary, average order value, and payment method breakdown")
    public ResponseEntity<RevenueSummaryResponse> getRevenueSummary() {
        return ResponseEntity.ok(dashboardService.getRevenueSummary());
    }
}
