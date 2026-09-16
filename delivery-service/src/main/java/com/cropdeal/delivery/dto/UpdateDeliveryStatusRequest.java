package com.cropdeal.delivery.dto;

//Used for updating delivery status.

import jakarta.validation.constraints.NotBlank;

public class UpdateDeliveryStatusRequest {

    @NotBlank
    private String status;

    public UpdateDeliveryStatusRequest() {
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}