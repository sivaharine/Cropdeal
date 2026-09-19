package com.cropdeal.admin.dto;

import java.math.BigDecimal;
import java.util.Map;

public record OrdersByStatusResponse(
        long totalOrders,
        Map<String, Long> statusBreakdown
) {}
