package com.cropdeal.auth.dto;

public class LoginResponse {

    private Long userId;
    private String email;
    private String username;
    private String role;
    private String token;

    public LoginResponse() {
    }

    public LoginResponse(
            Long userId,
            String email,
            String role,
            String token
    ) {
        this.userId = userId;
        this.email = email;
        this.role = role;
        this.token = token;
    }

    public LoginResponse(
            Long userId,
            String email,
            String username,
            String role,
            String token
    ) {
        this.userId = userId;
        this.email = email;
        this.username = username;
        this.role = role;
        this.token = token;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}