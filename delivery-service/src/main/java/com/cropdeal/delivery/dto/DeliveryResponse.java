package com.cropdeal.delivery.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class DeliveryResponse {

    private Long id;
    private String deliveryReference;
    private Long orderId;
    private String deliveryOption;
    private Long deliveryPartnerId;
    private BigDecimal deliveryCharge;
    private String currency;
    private String status;
    private String customerPhone;
    private String pickupAddress;
    private String deliveryAddress;
    private String deliveryOtp;
    private boolean otpVerified;
    private String receiptId;
    private LocalDateTime acceptedAt;
    private String acceptedBy;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DeliveryResponse() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDeliveryReference() { return deliveryReference; }
    public void setDeliveryReference(String deliveryReference) { this.deliveryReference = deliveryReference; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public String getDeliveryOption() { return deliveryOption; }
    public void setDeliveryOption(String deliveryOption) { this.deliveryOption = deliveryOption; }
    public Long getDeliveryPartnerId() { return deliveryPartnerId; }
    public void setDeliveryPartnerId(Long deliveryPartnerId) { this.deliveryPartnerId = deliveryPartnerId; }
    public BigDecimal getDeliveryCharge() { return deliveryCharge; }
    public void setDeliveryCharge(BigDecimal deliveryCharge) { this.deliveryCharge = deliveryCharge; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public String getPickupAddress() { return pickupAddress; }
    public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public String getDeliveryOtp() { return deliveryOtp; }
    public void setDeliveryOtp(String deliveryOtp) { this.deliveryOtp = deliveryOtp; }
    public boolean isOtpVerified() { return otpVerified; }
    public void setOtpVerified(boolean otpVerified) { this.otpVerified = otpVerified; }
    public String getReceiptId() { return receiptId; }
    public void setReceiptId(String receiptId) { this.receiptId = receiptId; }
    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(LocalDateTime acceptedAt) { this.acceptedAt = acceptedAt; }
    public String getAcceptedBy() { return acceptedBy; }
    public void setAcceptedBy(String acceptedBy) { this.acceptedBy = acceptedBy; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}