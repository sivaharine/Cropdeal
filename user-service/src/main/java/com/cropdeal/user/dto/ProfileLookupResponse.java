package com.cropdeal.user.dto;

public record ProfileLookupResponse(
        Long id,
        Long userId,
        String role,
        String name
) {
}
