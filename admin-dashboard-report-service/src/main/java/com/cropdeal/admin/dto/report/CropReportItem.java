package com.cropdeal.admin.dto.report;

import java.math.BigDecimal;

public record CropReportItem(
        Long cropId,
        Long farmerId,
        String commodity,
        String state,
        String district,
        String grade,
        BigDecimal quantity,
        String unit,
        BigDecimal pricePerKg,
        String status
) {}
