package com.cropdeal.delivery.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class DeliveryAssignmentRequest {

    @NotNull(message = "Order id is required")
    private Long orderId;

    private String deliveryOption; // SELF_PICKUP or DELIVERY_AGENT

    private String customerPhone;

    private String pickupAddress;

    private String deliveryAddress;

    private BigDecimal deliveryCharge;

    private Boolean paymentCompleted;

    private String paymentMethod;

    public DeliveryAssignmentRequest() {
    }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public String getDeliveryOption() { return deliveryOption; }
    public void setDeliveryOption(String deliveryOption) { this.deliveryOption = deliveryOption; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public String getPickupAddress() { return pickupAddress; }
    public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public BigDecimal getDeliveryCharge() { return deliveryCharge; }
    public void setDeliveryCharge(BigDecimal deliveryCharge) { this.deliveryCharge = deliveryCharge; }
    public Boolean getPaymentCompleted() { return paymentCompleted; }
    public void setPaymentCompleted(Boolean paymentCompleted) { this.paymentCompleted = paymentCompleted; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
}