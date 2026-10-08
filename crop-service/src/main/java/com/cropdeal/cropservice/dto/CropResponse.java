package com.cropdeal.cropservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CropResponse(
        Long id,
        Long farmerId,
        String farmerName,
        String commodity,
        String cropName,
        String state,
        String district,
        String location,
        String grade,
        BigDecimal quantity,
        BigDecimal availableQuantity,
        String unit,
        BigDecimal pricePerKg,
        BigDecimal pricePerUnit,
        String description,
        String imageUrl,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
