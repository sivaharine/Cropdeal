package com.cropdeal.chatbotservice.dto;

public record PriceSearchRequest(
        String commodity,
        String state,
        String district,
        String grade
) {
}
