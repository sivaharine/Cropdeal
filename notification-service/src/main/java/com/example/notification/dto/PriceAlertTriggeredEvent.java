package com.example.notification.dto;

import java.io.Serializable;
import java.math.BigDecimal;

public class PriceAlertTriggeredEvent implements Serializable {
    private Long subscriptionId;
    private Long userId;
    private String userRole;
    private String sourceType;
    private String sourceId;
    private String cropName;
    private String district;
    private String state;
    private BigDecimal targetPrice;
    private BigDecimal currentPrice;
    private BigDecimal quantity;
    private String unit;
    private String priceCondition;
    private String message;

    public PriceAlertTriggeredEvent() {}

    public Long getSubscriptionId() { return subscriptionId; }
    public void setSubscriptionId(Long subscriptionId) { this.subscriptionId = subscriptionId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }

    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }

    public String getSourceId() { return sourceId; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }

    public String getCropName() { return cropName; }
    public void setCropName(String cropName) { this.cropName = cropName; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public BigDecimal getTargetPrice() { return targetPrice; }
    public void setTargetPrice(BigDecimal targetPrice) { this.targetPrice = targetPrice; }

    public BigDecimal getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(BigDecimal currentPrice) { this.currentPrice = currentPrice; }

    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getPriceCondition() { return priceCondition; }
    public void setPriceCondition(String priceCondition) { this.priceCondition = priceCondition; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}