package com.cropdeal.report.controller;

import com.cropdeal.report.dto.*;
import com.cropdeal.report.service.ReportService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReportController.class)
@AutoConfigureMockMvc(addFilters = false)
class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReportService reportService;

    @Test
    @DisplayName("GET /api/reports/payments returns 200 and payment metrics")
    void testGetPaymentReport() throws Exception {
        PaymentReportResponse response = new PaymentReportResponse(10, 50000.0, 9, 1, 900.0, Map.of("UPI", 9L));
        when(reportService.getPaymentReport()).thenReturn(response);

        mockMvc.perform(get("/api/reports/payments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTransactions").value(10))
                .andExpect(jsonPath("$.totalRevenue").value(50000.0))
                .andExpect(jsonPath("$.successfulPayments").value(9))
                .andExpect(jsonPath("$.totalDeliveryFeesCollected").value(900.0));
    }

    @Test
    @DisplayName("GET /api/reports/dealers returns 200 and dealer metrics")
    void testGetDealerReport() throws Exception {
        DealerReportResponse response = new DealerReportResponse(5, 4, 20, 120000.0, 24000.0, Collections.emptyList());
        when(reportService.getDealerReport()).thenReturn(response);

        mockMvc.perform(get("/api/reports/dealers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDealers").value(5))
                .andExpect(jsonPath("$.totalAmountSpent").value(120000.0));
    }

    @Test
    @DisplayName("GET /api/reports/farmers returns 200 and farmer metrics")
    void testGetFarmerReport() throws Exception {
        FarmerReportResponse response = new FarmerReportResponse(12, 11, 1, 12, 4.8, 25, Collections.emptyList());
        when(reportService.getFarmerReport()).thenReturn(response);

        mockMvc.perform(get("/api/reports/farmers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalFarmers").value(12))
                .andExpect(jsonPath("$.averageFarmerRating").value(4.8))
                .andExpect(jsonPath("$.blockedFarmers").value(1));
    }

    @Test
    @DisplayName("GET /api/reports/delivery-partners returns 200 and delivery partner metrics")
    void testGetDeliveryPartnerReport() throws Exception {
        DeliveryPartnerReportResponse response = new DeliveryPartnerReportResponse(8, 6, 2, 0, 15, 1500.0, Map.of("BIKE", 6L));
        when(reportService.getDeliveryPartnerReport()).thenReturn(response);

        mockMvc.perform(get("/api/reports/delivery-partners"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDeliveryPartners").value(8))
                .andExpect(jsonPath("$.availablePartners").value(6))
                .andExpect(jsonPath("$.totalDeliveryFeesEarned").value(1500.0));
    }

    @Test
    @DisplayName("GET /api/reports/crops returns 200 and crop metrics")
    void testGetCropReport() throws Exception {
        CropReportResponse response = new CropReportResponse(30, 25, 5000.0, 45.5, Map.of("WHEAT", 10L), Collections.emptyList());
        when(reportService.getCropReport()).thenReturn(response);

        mockMvc.perform(get("/api/reports/crops"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCropsListed").value(30))
                .andExpect(jsonPath("$.totalStockQuantityKg").value(5000.0))
                .andExpect(jsonPath("$.averagePricePerKg").value(45.5));
    }

    @Test
    @DisplayName("GET /api/reports/dashboard returns 200 and executive dashboard")
    void testGetDashboard() throws Exception {
        ExecutiveDashboardReport response = new ExecutiveDashboardReport(
                new PaymentReportResponse(10, 50000.0, 9, 1, 900.0, Map.of()),
                new DealerReportResponse(5, 4, 20, 120000.0, 24000.0, Collections.emptyList()),
                new FarmerReportResponse(12, 11, 1, 12, 4.8, 25, Collections.emptyList()),
                new DeliveryPartnerReportResponse(8, 6, 2, 0, 15, 1500.0, Map.of()),
                new CropReportResponse(30, 25, 5000.0, 45.5, Map.of(), Collections.emptyList()),
                "2026-09-18T10:00:00Z"
        );
        when(reportService.getExecutiveDashboard()).thenReturn(response);

        mockMvc.perform(get("/api/reports/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentSummary.totalRevenue").value(50000.0))
                .andExpect(jsonPath("$.farmerSummary.totalFarmers").value(12))
                .andExpect(jsonPath("$.generatedAt").isNotEmpty());
    }
}
