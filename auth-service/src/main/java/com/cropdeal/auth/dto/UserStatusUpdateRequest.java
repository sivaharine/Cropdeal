package com.cropdeal.auth.dto;

import com.cropdeal.auth.enums.UserStatus;
import jakarta.validation.constraints.NotNull;

public class UserStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private UserStatus status;

    public UserStatusUpdateRequest() {
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }
}
