package com.cropdeal.report.service;

import com.cropdeal.report.client.CropClient;
import com.cropdeal.report.client.OrderClient;
import com.cropdeal.report.client.PaymentClient;
import com.cropdeal.report.client.UserClient;
import com.cropdeal.report.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private UserClient userClient;

    @Mock
    private PaymentClient paymentClient;

    @Mock
    private OrderClient orderClient;

    @Mock
    private CropClient cropClient;

    @InjectMocks
    private ReportServiceImpl reportService;

    @Test
    @DisplayName("Payment report correctly aggregates amounts and delivery fees")
    void testGetPaymentReport() {
        when(paymentClient.getAllPayments()).thenReturn(List.of(
                Map.of("amount", 2000.0, "status", "SUCCESS", "paymentMethod", "UPI"),
                Map.of("amount", 3000.0, "status", "PAID", "paymentMethod", "CARD"),
                Map.of("amount", 500.0, "status", "FAILED", "paymentMethod", "UPI")
        ));

        PaymentReportResponse report = reportService.getPaymentReport();

        assertNotNull(report);
        assertEquals(3, report.getTotalTransactions());
        assertEquals(5000.0, report.getTotalRevenue());
        assertEquals(2, report.getSuccessfulPayments());
        assertEquals(1, report.getFailedPayments());
        assertEquals(200.0, report.getTotalDeliveryFeesCollected()); // 2 * 100
        assertEquals(2, report.getPaymentMethodBreakdown().get("UPI"));
        assertEquals(1, report.getPaymentMethodBreakdown().get("CARD"));
    }

    @Test
    @DisplayName("Dealer report calculates total spending and orders")
    void testGetDealerReport() {
        when(userClient.getAllDealers()).thenReturn(List.of(
                Map.of("id", 1L, "name", "Dealer One"),
                Map.of("id", 2L, "name", "Dealer Two")
        ));
        when(orderClient.getAllOrders()).thenReturn(List.of(
                Map.of("dealerId", 1L, "totalAmount", 15000.0),
                Map.of("dealerId", 1L, "totalAmount", 5000.0),
                Map.of("dealerId", 2L, "totalAmount", 10000.0)
        ));

        DealerReportResponse report = reportService.getDealerReport();

        assertNotNull(report);
        assertEquals(2, report.getTotalDealers());
        assertEquals(2, report.getActiveDealers());
        assertEquals(3, report.getTotalOrdersPlaced());
        assertEquals(30000.0, report.getTotalAmountSpent());
        assertEquals(15000.0, report.getAverageSpendPerDealer());
    }

    @Test
    @DisplayName("Farmer report tracks active and blocked farmers and average ratings")
    void testGetFarmerReport() {
        when(userClient.getAllFarmers()).thenReturn(List.of(
                Map.of("id", 1L, "name", "Ramesh", "isBlocked", false, "averageRating", 4.5),
                Map.of("id", 2L, "name", "Suresh", "isBlocked", true, "averageRating", 3.5)
        ));
        when(userClient.getAllReviews()).thenReturn(List.of(
                Map.of("id", 101L, "rating", 5),
                Map.of("id", 102L, "rating", 4)
        ));

        FarmerReportResponse report = reportService.getFarmerReport();

        assertNotNull(report);
        assertEquals(2, report.getTotalFarmers());
        assertEquals(1, report.getActiveFarmers());
        assertEquals(1, report.getBlockedFarmers());
        assertEquals(4.0, report.getAverageFarmerRating());
        assertEquals(2, report.getTotalReviewsReceived());
    }

    @Test
    @DisplayName("Delivery partner report summarizes availability and vehicle distribution")
    void testGetDeliveryPartnerReport() {
        when(userClient.getAllDeliveryPartners()).thenReturn(List.of(
                Map.of("id", 1L, "availabilityStatus", "AVAILABLE", "vehicleType", "BIKE"),
                Map.of("id", 2L, "availabilityStatus", "BUSY", "vehicleType", "TRUCK")
        ));

        DeliveryPartnerReportResponse report = reportService.getDeliveryPartnerReport();

        assertNotNull(report);
        assertEquals(2, report.getTotalDeliveryPartners());
        assertEquals(1, report.getAvailablePartners());
        assertEquals(1, report.getBusyPartners());
        assertEquals(200.0, report.getTotalDeliveryFeesEarned());
        assertEquals(1, report.getVehicleDistribution().get("BIKE"));
        assertEquals(1, report.getVehicleDistribution().get("TRUCK"));
    }

    @Test
    @DisplayName("Crop report summarizes quantities and commodities")
    void testGetCropReport() {
        when(cropClient.searchCrops()).thenReturn(List.of(
                Map.of("commodity", "WHEAT", "quantity", 1000.0, "pricePerKg", 30.0, "status", "AVAILABLE"),
                Map.of("commodity", "RICE", "quantity", 2000.0, "pricePerKg", 50.0, "status", "AVAILABLE")
        ));

        CropReportResponse report = reportService.getCropReport();

        assertNotNull(report);
        assertEquals(2, report.getTotalCropsListed());
        assertEquals(2, report.getActiveListings());
        assertEquals(3000.0, report.getTotalStockQuantityKg());
        assertEquals(40.0, report.getAveragePricePerKg());
    }

    @Test
    @DisplayName("Executive dashboard aggregates all reports safely")
    void testGetExecutiveDashboard() {
        when(paymentClient.getAllPayments()).thenReturn(List.of());
        when(userClient.getAllDealers()).thenReturn(List.of());
        when(orderClient.getAllOrders()).thenReturn(List.of());
        when(userClient.getAllFarmers()).thenReturn(List.of());
        when(userClient.getAllReviews()).thenReturn(List.of());
        when(userClient.getAllDeliveryPartners()).thenReturn(List.of());
        when(cropClient.searchCrops()).thenReturn(List.of());

        ExecutiveDashboardReport dashboard = reportService.getExecutiveDashboard();

        assertNotNull(dashboard);
        assertNotNull(dashboard.getPaymentSummary());
        assertNotNull(dashboard.getDealerSummary());
        assertNotNull(dashboard.getFarmerSummary());
        assertNotNull(dashboard.getDeliveryPartnerSummary());
        assertNotNull(dashboard.getCropSummary());
        assertNotNull(dashboard.getGeneratedAt());
    }
}
