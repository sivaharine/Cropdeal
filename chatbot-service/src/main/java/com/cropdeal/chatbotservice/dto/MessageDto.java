package com.cropdeal.chatbotservice.dto;

import jakarta.validation.constraints.NotBlank;

public record MessageDto(
        @NotBlank String role,
        @NotBlank String content
) {
}
