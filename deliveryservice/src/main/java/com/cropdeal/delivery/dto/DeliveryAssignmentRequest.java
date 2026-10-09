package com.cropdeal.delivery.dto;

//Used when creating a delivery and assigning a delivery agent.

import jakarta.validation.constraints.NotNull;

public class DeliveryAssignmentRequest {

    @NotNull
    private Long orderId;

    private Long deliveryAgentId;

    @NotNull
    private String pickupAddress;

    @NotNull
    private String deliveryAddress;

    public DeliveryAssignmentRequest() {
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

    public String getPickupAddress() {
        return pickupAddress;
    }

    public void setPickupAddress(String pickupAddress) {
        this.pickupAddress = pickupAddress;
    }

    private Long dealerId;
    private String dealerName;
    private String dealerPhone;

    private Long farmerId;
    private String farmerName;
    private String farmerPhone;

    private String cropName;
    private java.math.BigDecimal cropQuantity;
    private String cropUnit;

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
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