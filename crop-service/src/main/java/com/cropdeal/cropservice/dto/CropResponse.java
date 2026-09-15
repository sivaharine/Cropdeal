package com.cropdeal.cropservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CropResponse(Long id, Long farmerId, String commodity, String state, String district,
                           String grade, BigDecimal quantity, String unit, BigDecimal pricePerKg,
                           String description, String status, LocalDateTime createdAt, LocalDateTime updatedAt) {}
