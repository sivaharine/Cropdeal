package com.cropdeal.report.controller;

import com.cropdeal.report.dto.*;
import com.cropdeal.report.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Admin Reports", description = "Endpoints for generating analytical reports on Payments, Dealers, Farmers, Delivery Partners, and Crops")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get Executive Dashboard Overview", description = "Returns aggregated high-level business metrics across all entities.")
    public ResponseEntity<ExecutiveDashboardReport> getDashboard() {
        return ResponseEntity.ok(reportService.getExecutiveDashboard());
    }

    @GetMapping("/payments")
    @Operation(summary = "Get Payment Analytics Report", description = "Returns total payments, revenues, delivery fees collected, and payment method distribution.")
    public ResponseEntity<PaymentReportResponse> getPaymentReport() {
        return ResponseEntity.ok(reportService.getPaymentReport());
    }

    @GetMapping("/dealers")
    @Operation(summary = "Get Dealer Performance Report", description = "Returns dealer metrics, active vs inactive counts, total spending, and top spending dealers.")
    public ResponseEntity<DealerReportResponse> getDealerReport() {
        return ResponseEntity.ok(reportService.getDealerReport());
    }

    @GetMapping("/farmers")
    @Operation(summary = "Get Farmer Analytics Report", description = "Returns farmer statistics, ratings, review counts, active vs blocked counts, and top-rated farmers.")
    public ResponseEntity<FarmerReportResponse> getFarmerReport() {
        return ResponseEntity.ok(reportService.getFarmerReport());
    }

    @GetMapping("/delivery-partners")
    @Operation(summary = "Get Delivery Partner Report", description = "Returns delivery partner availability, vehicle distribution, completed deliveries, and fee earnings.")
    public ResponseEntity<DeliveryPartnerReportResponse> getDeliveryPartnerReport() {
        return ResponseEntity.ok(reportService.getDeliveryPartnerReport());
    }

    @GetMapping("/crops")
    @Operation(summary = "Get Crop Market Report", description = "Returns crop listings overview, stock volume in kg, average price per kg, and category breakdowns.")
    public ResponseEntity<CropReportResponse> getCropReport() {
        return ResponseEntity.ok(reportService.getCropReport());
    }
}
