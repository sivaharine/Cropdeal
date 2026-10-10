package com.cropdeal.cropservice.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class CropUpdateRequest {
    @NotBlank(message = "Commodity is required") private String commodity;
    @NotBlank(message = "State is required") private String state;
    @NotBlank(message = "District is required") private String district;
    @NotBlank(message = "Grade is required") @Pattern(regexp = "(?i)A|B|C", message = "Grade must be A, B or C") private String grade;
    @NotNull(message = "Quantity is required") @Positive(message = "Quantity must be greater than zero") private BigDecimal quantity;
    @NotBlank(message = "Unit is required") private String unit;
    @NotNull(message = "Price per kg is required") @DecimalMin(value = "0.01", message = "Price per kg must be greater than zero") private BigDecimal pricePerKg;
    @Size(max = 1000, message = "Description cannot exceed 1000 characters") private String description;

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
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
