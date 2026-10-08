package com.cropdeal.cropservice.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class CropCreateRequest {
    @NotNull(message = "Farmer ID is required") @Positive(message = "Farmer ID must be positive")
    private Long farmerId;

    private String commodity;
    private String cropName;
    private String state;
    private String district;
    private String location;
    private String grade = "A";

    @NotNull(message = "Quantity is required") @Positive(message = "Quantity must be greater than zero")
    private BigDecimal quantity;

    private String unit = "KG";
    private BigDecimal pricePerKg;
    private BigDecimal pricePerUnit;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    private String farmerName;
    private String imageUrl;

    public Long getFarmerId() { return farmerId; }

    @com.fasterxml.jackson.annotation.JsonSetter("farmerId")
    public void setFarmerId(Object raw) {
        if (raw == null) {
            this.farmerId = 1L;
        } else if (raw instanceof Number n) {
            this.farmerId = n.longValue();
        } else {
            String s = raw.toString().replaceAll("\\D+", "");
            if (s.isEmpty()) {
                this.farmerId = 1L;
            } else {
                try {
                    this.farmerId = Long.parseLong(s);
                } catch (Exception e) {
                    this.farmerId = 1L;
                }
            }
        }
    }

    public String getCommodity() {
        if (commodity != null && !commodity.isBlank()) return commodity.trim();
        return (cropName != null && !cropName.isBlank()) ? cropName.trim() : "Wheat";
    }
    public void setCommodity(String commodity) { this.commodity = commodity; }

    public String getCropName() { return getCommodity(); }
    public void setCropName(String cropName) {
        this.cropName = cropName;
        if (this.commodity == null || this.commodity.isBlank()) {
            this.commodity = cropName;
        }
    }

    public String getState() {
        if (state != null && !state.isBlank()) return state.trim();
        parseLocation();
        return (state != null && !state.isBlank()) ? state.trim() : "Punjab";
    }
    public void setState(String state) { this.state = state; }

    public String getDistrict() {
        if (district != null && !district.isBlank()) return district.trim();
        parseLocation();
        return (district != null && !district.isBlank()) ? district.trim() : "Ludhiana";
    }
    public void setDistrict(String district) { this.district = district; }

    public String getLocation() { return location; }
    public void setLocation(String location) {
        this.location = location;
        parseLocation();
    }

    private void parseLocation() {
        if (location != null && !location.isBlank()) {
            String[] parts = location.split(",");
            if (parts.length >= 2) {
                if (state == null || state.isBlank()) {
                    state = parts[parts.length - 1].trim();
                }
                if (district == null || district.isBlank()) {
                    district = parts[parts.length - 2].trim();
                }
            } else if (parts.length == 1) {
                if (district == null || district.isBlank()) district = parts[0].trim();
                if (state == null || state.isBlank()) state = parts[0].trim();
            }
        }
    }

    public String getGrade() {
        return (grade != null && !grade.isBlank()) ? grade.trim().toUpperCase() : "A";
    }
    public void setGrade(String grade) { this.grade = grade; }

    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }

    public String getUnit() {
        return (unit != null && !unit.isBlank()) ? unit.trim().toUpperCase() : "KG";
    }
    public void setUnit(String unit) { this.unit = unit; }

    public BigDecimal getPricePerKg() {
        if (pricePerKg != null) return pricePerKg;
        return pricePerUnit != null ? pricePerUnit : BigDecimal.valueOf(25.0);
    }
    public void setPricePerKg(BigDecimal pricePerKg) { this.pricePerKg = pricePerKg; }

    public BigDecimal getPricePerUnit() { return getPricePerKg(); }
    public void setPricePerUnit(BigDecimal pricePerUnit) {
        this.pricePerUnit = pricePerUnit;
        if (this.pricePerKg == null) this.pricePerKg = pricePerUnit;
    }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getFarmerName() { return farmerName; }
    public void setFarmerName(String farmerName) { this.farmerName = farmerName; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
