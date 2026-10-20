package com.cropdeal.chatbotservice.dto;

import java.time.LocalDate;

public record CropPriceResponse(
        String commodity,
        String state,
        String district,
        String grade,
        LocalDate priceDate,
        Double minPricePerKg,
        Double maxPricePerKg
) {
}
