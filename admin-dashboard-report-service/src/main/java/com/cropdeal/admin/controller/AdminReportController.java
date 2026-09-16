package com.cropdeal.admin.controller;

import com.cropdeal.admin.dto.report.*;
import com.cropdeal.admin.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/reports")
@Tag(name = "Admin Reports", description = "Multi-Entity Reporting & CSV Export Endpoints")
public class AdminReportController {

    private final ReportService reportService;

    public AdminReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // --- Farmers Report ---
    @GetMapping("/farmers")
    @Operation(summary = "Get Farmers activity and crop summary report (JSON)")
    public ResponseEntity<List<FarmerReportItem>> getFarmersReport() {
        return ResponseEntity.ok(reportService.getFarmersReport());
    }

    @GetMapping("/farmers/csv")
    @Operation(summary = "Download Farmers report in CSV format")
    public ResponseEntity<byte[]> exportFarmersReportCsv() {
        byte[] csv = reportService.exportFarmersReportCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=farmers_report.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    // --- Dealers Report ---
    @GetMapping("/dealers")
    @Operation(summary = "Get Dealers purchasing and order activity report (JSON)")
    public ResponseEntity<List<DealerReportItem>> getDealersReport() {
        return ResponseEntity.ok(reportService.getDealersReport());
    }

    @GetMapping("/dealers/csv")
    @Operation(summary = "Download Dealers report in CSV format")
    public ResponseEntity<byte[]> exportDealersReportCsv() {
        byte[] csv = reportService.exportDealersReportCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=dealers_report.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    // --- Crops Report ---
    @GetMapping("/crops")
    @Operation(summary = "Get Crop catalog inventory and pricing report (JSON)")
    public ResponseEntity<List<CropReportItem>> getCropsReport() {
        return ResponseEntity.ok(reportService.getCropsReport());
    }

    @GetMapping("/crops/csv")
    @Operation(summary = "Download Crops report in CSV format")
    public ResponseEntity<byte[]> exportCropsReportCsv() {
        byte[] csv = reportService.exportCropsReportCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=crops_report.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    // --- Orders Report ---
    @GetMapping("/orders")
    @Operation(summary = "Get Orders lifecycle and status report (JSON)")
    public ResponseEntity<List<OrderReportItem>> getOrdersReport() {
        return ResponseEntity.ok(reportService.getOrdersReport());
    }

    @GetMapping("/orders/csv")
    @Operation(summary = "Download Orders report in CSV format")
    public ResponseEntity<byte[]> exportOrdersReportCsv() {
        byte[] csv = reportService.exportOrdersReportCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=orders_report.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    // --- Payments Report ---
    @GetMapping("/payments")
    @Operation(summary = "Get Payments and transaction audit report (JSON)")
    public ResponseEntity<List<PaymentReportItem>> getPaymentsReport() {
        return ResponseEntity.ok(reportService.getPaymentsReport());
    }

    @GetMapping("/payments/csv")
    @Operation(summary = "Download Payments report in CSV format")
    public ResponseEntity<byte[]> exportPaymentsReportCsv() {
        byte[] csv = reportService.exportPaymentsReportCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payments_report.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}
