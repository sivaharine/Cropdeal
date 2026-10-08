package com.cropdeal.chatbotservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {
    private String sessionId;

    @NotBlank
    private String message;

    public ChatRequest(String message) {
        this.message = message;
    }

    public String message() {
        return this.message;
    }

    public String sessionId() {
        return this.sessionId;
    }
}
