package com.cropdeal.priceservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class PriceSearchRequest {

    @NotBlank(message = "Commodity is required")
    private String commodity;

    @NotBlank(message = "State is required")
    private String state;

    private String district;

    @NotBlank(message = "Grade is required")
    @Pattern(regexp = "(?i)A|B|C", message = "Grade must be A, B or C")
    private String grade;

    public String getCommodity() { return commodity; }
    public void setCommodity(String commodity) { this.commodity = commodity; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
}
