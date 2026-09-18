package com.cropdeal.cropservice.dto;

import java.io.Serializable;
import java.math.BigDecimal;

public class CropListingCreatedEvent implements Serializable {
    private Long cropId;
    private Long farmerId;
    private String commodity;
    private String state;
    private String district;
    private String grade;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal pricePerKg;

    public CropListingCreatedEvent() {}

    public CropListingCreatedEvent(Long cropId, Long farmerId, String commodity, String state, String district, String grade, BigDecimal quantity, String unit, BigDecimal pricePerKg) {
        this.cropId = cropId;
        this.farmerId = farmerId;
        this.commodity = commodity;
        this.state = state;
        this.district = district;
        this.grade = grade;
        this.quantity = quantity;
        this.unit = unit;
        this.pricePerKg = pricePerKg;
    }

    public Long getCropId() { return cropId; }
    public void setCropId(Long cropId) { this.cropId = cropId; }

    public Long getFarmerId() { return farmerId; }
    public void setFarmerId(Long farmerId) { this.farmerId = farmerId; }

    public String getCommodity() { return commodity; }
    public void setCommodity(String commodity) { this.commodity = commodity; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }

    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public BigDecimal getPricePerKg() { return pricePerKg; }
    public void setPricePerKg(BigDecimal pricePerKg) { this.pricePerKg = pricePerKg; }
}