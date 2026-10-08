package com.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class CreateOrderRequest {

    @NotNull
    private Long farmerId;

    @NotNull
    private Long dealerId;

    @NotNull
    private Long cropId;

    @NotNull
    private String cropName;

    @NotNull
    @Min(1)
    private Integer quantity;

    private BigDecimal unitPrice;
    private BigDecimal pricePerUnit;
    private BigDecimal totalPrice;
    private String dealerName;
    private String farmerName;
    private String deliveryAddress;
    private String fulfillmentType;
    private String paymentMethod;
    private String transactionId;
    private Boolean isBidding;

    public CreateOrderRequest() {
    }

    public Long getFarmerId() {
        return farmerId;
    }

    @com.fasterxml.jackson.annotation.JsonSetter("farmerId")
    public void setFarmerId(Object raw) {
        this.farmerId = parseLongId(raw, 1L);
    }

    public Long getDealerId() {
        return dealerId;
    }

    @com.fasterxml.jackson.annotation.JsonSetter("dealerId")
    public void setDealerId(Object raw) {
        this.dealerId = parseLongId(raw, 2L);
    }

    public Long getCropId() {
        return cropId;
    }

    @com.fasterxml.jackson.annotation.JsonSetter("cropId")
    public void setCropId(Object raw) {
        this.cropId = parseLongId(raw, 1L);
    }

    private Long parseLongId(Object raw, Long def) {
        if (raw == null) return def;
        if (raw instanceof Number n) return n.longValue();
        String s = raw.toString().replaceAll("\\D+", "");
        if (s.isEmpty()) return def;
        try {
            return Long.parseLong(s);
        } catch (Exception e) {
            return def;
        }
    }

    public String getCropName() {
        return cropName;
    }

    public void setCropName(String cropName) {
        this.cropName = cropName;
    }

    public Integer getQuantity() {
        return quantity != null && quantity > 0 ? quantity : 1;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        if (unitPrice != null) return unitPrice;
        if (pricePerUnit != null) return pricePerUnit;
        if (totalPrice != null && quantity != null && quantity > 0) {
            return totalPrice.divide(BigDecimal.valueOf(quantity), 2, java.math.RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(25.0);
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getPricePerUnit() {
        return getUnitPrice();
    }

    public void setPricePerUnit(BigDecimal pricePerUnit) {
        this.pricePerUnit = pricePerUnit;
        if (this.unitPrice == null) this.unitPrice = pricePerUnit;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice != null ? totalPrice : getUnitPrice().multiply(BigDecimal.valueOf(getQuantity()));
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    public String getDealerName() { return dealerName; }
    public void setDealerName(String dealerName) { this.dealerName = dealerName; }

    public String getFarmerName() { return farmerName; }
    public void setFarmerName(String farmerName) { this.farmerName = farmerName; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public String getFulfillmentType() { return fulfillmentType; }
    public void setFulfillmentType(String fulfillmentType) { this.fulfillmentType = fulfillmentType; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public Boolean getIsBidding() { return isBidding; }
    public void setIsBidding(Boolean isBidding) { this.isBidding = isBidding; }
}