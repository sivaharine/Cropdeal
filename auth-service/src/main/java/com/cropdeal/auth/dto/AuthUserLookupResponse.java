package com.cropdeal.auth.dto;

public record AuthUserLookupResponse(
        Long id,
        String email,
        String role,
        String status
) {
}
