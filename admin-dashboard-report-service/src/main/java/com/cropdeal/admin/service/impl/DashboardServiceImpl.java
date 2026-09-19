package com.cropdeal.admin.service.impl;

import com.cropdeal.admin.client.CropServiceClient;
import com.cropdeal.admin.client.OrderServiceClient;
import com.cropdeal.admin.client.PaymentServiceClient;
import com.cropdeal.admin.client.UserServiceClient;
import com.cropdeal.admin.dto.DashboardSummaryResponse;
import com.cropdeal.admin.dto.OrdersByStatusResponse;
import com.cropdeal.admin.dto.RevenueSummaryResponse;
import com.cropdeal.admin.dto.client.CropClientDto;
import com.cropdeal.admin.dto.client.DealerClientDto;
import com.cropdeal.admin.dto.client.DeliveryPartnerClientDto;
import com.cropdeal.admin.dto.client.FarmerClientDto;
import com.cropdeal.admin.dto.client.OrderClientDto;
import com.cropdeal.admin.dto.client.PaymentClientDto;
import com.cropdeal.admin.service.DashboardService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardService {

    private static final Logger log = LoggerFactory.getLogger(DashboardServiceImpl.class);

    private final UserServiceClient userServiceClient;
    private final CropServiceClient cropServiceClient;
    private final OrderServiceClient orderServiceClient;
    private final PaymentServiceClient paymentServiceClient;

    public DashboardServiceImpl(
            UserServiceClient userServiceClient,
            CropServiceClient cropServiceClient,
            OrderServiceClient orderServiceClient,
            PaymentServiceClient paymentServiceClient
    ) {
        this.userServiceClient = userServiceClient;
        this.cropServiceClient = cropServiceClient;
        this.orderServiceClient = orderServiceClient;
        this.paymentServiceClient = paymentServiceClient;
    }

    @Override
    public DashboardSummaryResponse getSummary() {
        List<FarmerClientDto> farmers = safeFetch(userServiceClient::getAllFarmers, Collections.emptyList(), "farmers");
        List<DealerClientDto> dealers = safeFetch(userServiceClient::getAllDealers, Collections.emptyList(), "dealers");
        List<DeliveryPartnerClientDto> deliveryPartners = safeFetch(userServiceClient::getAllDeliveryPartners, Collections.emptyList(), "delivery-partners");
        List<CropClientDto> crops = safeFetch(cropServiceClient::searchCrops, Collections.emptyList(), "crops");
        List<OrderClientDto> orders = safeFetch(orderServiceClient::getAllOrders, Collections.emptyList(), "orders");
        List<PaymentClientDto> payments = safeFetch(paymentServiceClient::getAllPayments, Collections.emptyList(), "payments");

        long totalFarmers = farmers.size();
        long totalDealers = dealers.size();
        long totalDeliveryPartners = deliveryPartners.size();
        long totalCrops = crops.size();
        long availableCrops = crops.stream()
                .filter(c -> "AVAILABLE".equalsIgnoreCase(c.getStatus()))
                .count();

        long totalOrders = orders.size();
        long completedOrders = orders.stream()
                .filter(o -> "DELIVERED".equalsIgnoreCase(o.getStatus()))
                .count();
        long paidOrders = orders.stream()
                .filter(o -> "PAID".equalsIgnoreCase(o.getStatus()))
                .count();
        long cancelledOrders = orders.stream()
                .filter(o -> "CANCELLED".equalsIgnoreCase(o.getStatus()))
                .count();

        long totalTransactions = payments.size();
        long successfulPayments = payments.stream()
                .filter(p -> "SUCCESS".equalsIgnoreCase(p.getStatus()))
                .count();
        long failedPayments = payments.stream()
                .filter(p -> "FAILED".equalsIgnoreCase(p.getStatus()))
                .count();

        BigDecimal totalRevenue = payments.stream()
                .filter(p -> "SUCCESS".equalsIgnoreCase(p.getStatus()) && p.getAmount() != null)
                .map(PaymentClientDto::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new DashboardSummaryResponse(
                totalFarmers,
                totalDealers,
                totalDeliveryPartners,
                totalCrops,
                availableCrops,
                totalOrders,
                completedOrders,
                paidOrders,
                cancelledOrders,
                totalTransactions,
                totalRevenue,
                successfulPayments,
                failedPayments
        );
    }

    @Override
    public OrdersByStatusResponse getOrdersByStatus() {
        List<OrderClientDto> orders = safeFetch(orderServiceClient::getAllOrders, Collections.emptyList(), "orders");
        Map<String, Long> breakdown = orders.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getStatus() == null ? "UNKNOWN" : o.getStatus().toUpperCase(),
                        Collectors.counting()
                ));
        return new OrdersByStatusResponse(orders.size(), breakdown);
    }

    @Override
    public RevenueSummaryResponse getRevenueSummary() {
        List<PaymentClientDto> payments = safeFetch(paymentServiceClient::getAllPayments, Collections.emptyList(), "payments");

        List<PaymentClientDto> successfulPayments = payments.stream()
                .filter(p -> "SUCCESS".equalsIgnoreCase(p.getStatus()) && p.getAmount() != null)
                .toList();

        BigDecimal totalRevenue = successfulPayments.stream()
                .map(PaymentClientDto::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long count = successfulPayments.size();
        BigDecimal avgOrderValue = count > 0
                ? totalRevenue.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, BigDecimal> revenueByMethod = new HashMap<>();
        for (PaymentClientDto p : successfulPayments) {
            String method = p.getPaymentMethod() != null ? p.getPaymentMethod().toUpperCase() : "OTHER";
            revenueByMethod.merge(method, p.getAmount(), BigDecimal::add);
        }

        return new RevenueSummaryResponse(totalRevenue, avgOrderValue, count, revenueByMethod);
    }

    private <T> T safeFetch(java.util.function.Supplier<T> supplier, T fallback, String resourceName) {
        try {
            return supplier.get();
        } catch (Exception e) {
            log.warn("Failed to fetch {} from upstream service: {}", resourceName, e.getMessage());
            return fallback;
        }
    }
}
