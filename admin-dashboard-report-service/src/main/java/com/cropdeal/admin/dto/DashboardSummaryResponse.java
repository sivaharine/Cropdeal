package com.cropdeal.admin.dto;

import java.math.BigDecimal;

public record DashboardSummaryResponse(
        long totalFarmers,
        long totalDealers,
        long totalDeliveryPartners,
        long totalCrops,
        long availableCrops,
        long totalOrders,
        long completedOrders,
        long paidOrders,
        long cancelledOrders,
        long totalTransactions,
        BigDecimal totalRevenue,
        long successfulPayments,
        long failedPayments
) {}
