package com.cropdeal.admin.dto.report;

import java.math.BigDecimal;

public record DealerReportItem(
        Long dealerId,
        Long userId,
        String name,
        String phone,
        String businessName,
        String address,
        long totalOrdersPlaced,
        BigDecimal totalAmountSpent
) {}
