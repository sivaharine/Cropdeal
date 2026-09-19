package com.cropdeal.delivery.dto;

public class VerifyDeliveryRequest {
    private String verificationCode;
    private Long deliveryPartnerId;

    public VerifyDeliveryRequest() {}

    public String getVerificationCode() { return verificationCode; }
    public void setVerificationCode(String verificationCode) { this.verificationCode = verificationCode; }
    public Long getDeliveryPartnerId() { return deliveryPartnerId; }
    public void setDeliveryPartnerId(Long deliveryPartnerId) { this.deliveryPartnerId = deliveryPartnerId; }
}