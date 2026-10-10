package com.cropdeal.chatbotservice.dto;

import jakarta.validation.constraints.NotBlank;

public class ChatRequest {
    private String sessionId;

    @NotBlank
    private String message;

    public ChatRequest() {
    }

    public ChatRequest(String message) {
        this.message = message;
    }

    public ChatRequest(String sessionId, String message) {
        this.sessionId = sessionId;
        this.message = message;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String sessionId;
        private String message;

        public Builder sessionId(String sessionId) {
            this.sessionId = sessionId;
            return this;
        }

        public Builder message(String message) {
            this.message = message;
            return this;
        }

        public ChatRequest build() {
            return new ChatRequest(sessionId, message);
        }
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String message() {
        return this.message;
    }

    public String sessionId() {
        return this.sessionId;
    }
}
