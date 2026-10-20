package com.cropdeal.user.dto;

import jakarta.validation.constraints.NotBlank;

public class UserStatusUpdateRequest {

    @NotBlank(message = "Status is required (ACTIVE, INACTIVE, SUSPENDED)")
    private String status;

    public UserStatusUpdateRequest() {
    }

    public UserStatusUpdateRequest(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
