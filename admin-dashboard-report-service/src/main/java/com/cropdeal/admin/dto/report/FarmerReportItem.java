package com.cropdeal.admin.dto.report;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FarmerReportItem(
        Long farmerId,
        Long userId,
        String name,
        String phone,
        String address,
        String farmLocation,
        long totalCropsListed,
        BigDecimal estimatedCropValue
) {}
