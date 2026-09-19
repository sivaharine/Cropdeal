package com.cropdeal.admin.dto.client;

public class UserStatusUpdateClientRequest {
    private boolean active;
    private String reason;

    public UserStatusUpdateClientRequest() {}

    public UserStatusUpdateClientRequest(boolean active, String reason) {
        this.active = active;
        this.reason = reason;
    }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
