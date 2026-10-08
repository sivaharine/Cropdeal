package com.cropdeal.priceservice.dto;

import java.time.LocalDate;

public class CropPriceResponse {
    private String commodity;
    private String state;
    private String district;
    private String grade;
    private LocalDate priceDate;
    private Double minPricePerKg;
    private Double maxPricePerKg;
    private Double modalPricePerKg;

    public String getCommodity() { return commodity; }
    public void setCommodity(String commodity) { this.commodity = commodity; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public LocalDate getPriceDate() { return priceDate; }
    public void setPriceDate(LocalDate priceDate) { this.priceDate = priceDate; }
    public Double getMinPricePerKg() { return minPricePerKg; }
    public void setMinPricePerKg(Double minPricePerKg) { this.minPricePerKg = minPricePerKg; }
    public Double getMaxPricePerKg() { return maxPricePerKg; }
    public void setMaxPricePerKg(Double maxPricePerKg) { this.maxPricePerKg = maxPricePerKg; }
    public Double getModalPricePerKg() { return modalPricePerKg; }
    public void setModalPricePerKg(Double modalPricePerKg) { this.modalPricePerKg = modalPricePerKg; }

    public Double getReferencePrice() {
        return modalPricePerKg;
    }

    public Double getMinAllowedPrice() {
        return minPricePerKg != null ? minPricePerKg : (modalPricePerKg != null ? Math.round(modalPricePerKg * 0.85 * 100.0) / 100.0 : null);
    }

    public Double getMaxAllowedPrice() {
        return maxPricePerKg != null ? maxPricePerKg : (modalPricePerKg != null ? Math.round(modalPricePerKg * 1.35 * 100.0) / 100.0 : null);
    }
}
