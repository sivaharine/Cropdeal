package com.cropdeal.admin.dto.report;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderReportItem(
        Long orderId,
        Long dealerId,
        Long farmerId,
        Long cropId,
        String cropName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalAmount,
        String status,
        LocalDateTime createdAt
) {}
