package com.example.notification.dto;

import jakarta.validation.constraints.NotBlank;

public class OtpNotificationRequest {

    @NotBlank
    private String phoneNumber;

    @NotBlank
    private String otp;

    public OtpNotificationRequest() {
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }
}