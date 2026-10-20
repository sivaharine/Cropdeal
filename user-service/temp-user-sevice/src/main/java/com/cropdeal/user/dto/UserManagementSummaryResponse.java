package com.cropdeal.user.dto;

public class UserManagementSummaryResponse {

    private Long userId;
    private String name;
    private String phone;
    private String role;
    private String status;
    private String address;
    private Double rating;
    private String additionalInfo;

    public UserManagementSummaryResponse() {
    }

    public UserManagementSummaryResponse(
            Long userId,
            String name,
            String phone,
            String role,
            String status,
            String address,
            Double rating,
            String additionalInfo
    ) {
        this.userId = userId;
        this.name = name;
        this.phone = phone;
        this.role = role;
        this.status = status;
        this.address = address;
        this.rating = rating;
        this.additionalInfo = additionalInfo;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public String getAdditionalInfo() {
        return additionalInfo;
    }

    public void setAdditionalInfo(String additionalInfo) {
        this.additionalInfo = additionalInfo;
    }
}
