package com.cropdeal.auth.dto;

import com.cropdeal.auth.enums.Role;
import jakarta.validation.constraints.NotBlank;

public class FacebookLoginRequest {

    @NotBlank(message = "Facebook access token is required")
    private String accessToken;

    private Role role;

    public FacebookLoginRequest() {
    }

    public FacebookLoginRequest(String accessToken) {
        this.accessToken = accessToken;
    }

    public FacebookLoginRequest(String accessToken, Role role) {
        this.accessToken = accessToken;
        this.role = role;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
