package com.cropdeal.chatbotservice.dto;

public record ProfileLookupResponse(
        Long id,
        Long userId,
        String role,
        String name
) {
}
