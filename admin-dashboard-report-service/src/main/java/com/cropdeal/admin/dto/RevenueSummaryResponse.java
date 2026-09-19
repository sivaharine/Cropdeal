package com.cropdeal.admin.dto;

import java.math.BigDecimal;
import java.util.Map;

public record RevenueSummaryResponse(
        BigDecimal totalRevenue,
        BigDecimal averageOrderValue,
        long totalCompletedTransactions,
        Map<String, BigDecimal> revenueByPaymentMethod
) {}
