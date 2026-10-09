package com.cropdeal.delivery.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "deliveries")
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;

    private Long deliveryAgentId;

    private String customerPhone;

    private String pickupAddress;

    private String deliveryAddress;

    @Enumerated(EnumType.STRING)
    private DeliveryStatus status;

    private String deliveryOtp;

    private boolean otpVerified;

    @Enumerated(EnumType.STRING)
    private ReturnStatus returnStatus = ReturnStatus.NONE;

    @Enumerated(EnumType.STRING)
    private RefundStatus refundStatus = RefundStatus.NONE;

    @Column(precision = 10, scale = 2)
    private java.math.BigDecimal deliveryFee = new java.math.BigDecimal("100.00");

    private boolean feePaid = true;

    private String fulfillmentType = "DELIVERY_PARTNER"; // DELIVERY_PARTNER or SELF_PICKUP

    private Long dealerId;
    private String dealerName;
    private String dealerPhone;

    private Long farmerId;
    private String farmerName;
    private String farmerPhone;

    private String cropName;
    private java.math.BigDecimal cropQuantity;
    private String cropUnit;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public Delivery() {
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (status == null) {
            status = DeliveryStatus.CREATED;
        }

        if (returnStatus == null) {
            returnStatus = ReturnStatus.NONE;
        }

        if (refundStatus == null) {
            refundStatus = RefundStatus.NONE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getDeliveryAgentId() {
        return deliveryAgentId;
    }

    public void setDeliveryAgentId(Long deliveryAgentId) {
        this.deliveryAgentId = deliveryAgentId;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getPickupAddress() {
        return pickupAddress;
    }

    public void setPickupAddress(String pickupAddress) {
        this.pickupAddress = pickupAddress;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public DeliveryStatus getStatus() {
        return status;
    }

    public void setStatus(DeliveryStatus status) {
        this.status = status;
    }

    public String getDeliveryOtp() {
        return deliveryOtp;
    }

    public void setDeliveryOtp(String deliveryOtp) {
        this.deliveryOtp = deliveryOtp;
    }

    public boolean isOtpVerified() {
        return otpVerified;
    }

    public void setOtpVerified(boolean otpVerified) {
        this.otpVerified = otpVerified;
    }

    public ReturnStatus getReturnStatus() {
        return returnStatus;
    }

    public void setReturnStatus(ReturnStatus returnStatus) {
        this.returnStatus = returnStatus;
    }

    public RefundStatus getRefundStatus() {
        return refundStatus;
    }

    public void setRefundStatus(RefundStatus refundStatus) {
        this.refundStatus = refundStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public java.math.BigDecimal getDeliveryFee() {
        return deliveryFee;
    }

    public void setDeliveryFee(java.math.BigDecimal deliveryFee) {
        this.deliveryFee = deliveryFee;
    }

    public boolean isFeePaid() {
        return feePaid;
    }

    public void setFeePaid(boolean feePaid) {
        this.feePaid = feePaid;
    }

    public String getFulfillmentType() {
        return fulfillmentType;
    }

    public void setFulfillmentType(String fulfillmentType) {
        this.fulfillmentType = fulfillmentType;
    }

    public Long getDealerId() {
        return dealerId;
    }

    public void setDealerId(Long dealerId) {
        this.dealerId = dealerId;
    }

    public String getDealerName() {
        return dealerName;
    }

    public void setDealerName(String dealerName) {
        this.dealerName = dealerName;
    }

    public String getDealerPhone() {
        return dealerPhone;
    }

    public void setDealerPhone(String dealerPhone) {
        this.dealerPhone = dealerPhone;
    }

    public Long getFarmerId() {
        return farmerId;
    }

    public void setFarmerId(Long farmerId) {
        this.farmerId = farmerId;
    }

    public String getFarmerName() {
        return farmerName;
    }

    public void setFarmerName(String farmerName) {
        this.farmerName = farmerName;
    }

    public String getFarmerPhone() {
        return farmerPhone;
    }

    public void setFarmerPhone(String farmerPhone) {
        this.farmerPhone = farmerPhone;
    }

    public String getCropName() {
        return cropName;
    }

    public void setCropName(String cropName) {
        this.cropName = cropName;
    }

    public java.math.BigDecimal getCropQuantity() {
        return cropQuantity;
    }

    public void setCropQuantity(java.math.BigDecimal cropQuantity) {
        this.cropQuantity = cropQuantity;
    }

    public String getCropUnit() {
        return cropUnit;
    }

    public void setCropUnit(String cropUnit) {
        this.cropUnit = cropUnit;
    }
}