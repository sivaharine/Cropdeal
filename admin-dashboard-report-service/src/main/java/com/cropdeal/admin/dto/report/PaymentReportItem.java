package com.cropdeal.admin.dto.report;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentReportItem(
        Long paymentId,
        Long orderId,
        Long dealerId,
        Long farmerId,
        BigDecimal amount,
        String paymentMethod,
        String status,
        String transactionReference,
        LocalDateTime paidAt
) {}
