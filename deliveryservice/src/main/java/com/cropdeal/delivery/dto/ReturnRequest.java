package com.cropdeal.delivery.dto;

import jakarta.validation.constraints.NotBlank;

public class ReturnRequest {

    @NotBlank
    private String reason;

    private String description;

    public ReturnRequest() {
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}