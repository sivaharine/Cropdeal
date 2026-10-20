package com.cropdeal.chatbotservice.dto;

public record AuthUserLookupResponse(
        Long id,
        String email,
        String role,
        String status
) {
}
