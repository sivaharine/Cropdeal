package com.example.notification.dto;

public record AuthUserLookupResponse(
        Long id,
        String email,
        String role,
        String status
) {
}
