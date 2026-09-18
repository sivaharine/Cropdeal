package com.cropdeal.priceservice.dto;

import com.cropdeal.priceservice.entity.PriceCondition;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class PriceAlertSubscriptionRequest {

    @NotBlank(message = "Crop name is required")
    private String cropName;

    @NotNull(message = "Target price is required")
    @DecimalMin(value = "0.01", message = "Target price must be greater than 0")
    private BigDecimal targetPrice;

    @NotNull(message = "Price condition is required")
    private PriceCondition priceCondition;

    private String district;
    private String state;
    private String unit = "KG";
    private Boolean active = true;

    public String getCropName() { return cropName; }
    public void setCropName(String cropName) { this.cropName = cropName; }

    public BigDecimal getTargetPrice() { return targetPrice; }
    public void setTargetPrice(BigDecimal targetPrice) { this.targetPrice = targetPrice; }

    public PriceCondition getPriceCondition() { return priceCondition; }
    public void setPriceCondition(PriceCondition priceCondition) { this.priceCondition = priceCondition; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}