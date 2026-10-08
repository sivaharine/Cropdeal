package com.cropdeal.delivery.dto;

//Used when creating a delivery and assigning a delivery agent.

import jakarta.validation.constraints.NotNull;

public class DeliveryAssignmentRequest {

    @NotNull
    private Long orderId;

    @NotNull
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

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }
}