package com.cropdeal.chatbotservice.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatRequest(
        String sessionId,
        @NotBlank(message = "message is required") String message
) {
}
