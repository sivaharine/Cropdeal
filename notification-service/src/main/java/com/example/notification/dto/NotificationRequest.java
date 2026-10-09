package com.example.notification.dto;

import jakarta.validation.constraints.NotBlank;

public class NotificationRequest {

    @NotBlank
    private String recipient;

    @NotBlank
    private String type;

    @NotBlank
    private String message;

    private Long orderId;

    public NotificationRequest() {
    }

    public String getRecipient() {
        return recipient;
    }

    public void setRecipient(String recipient) {
        this.recipient = recipient;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }
}