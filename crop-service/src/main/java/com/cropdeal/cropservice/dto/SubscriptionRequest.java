package com.cropdeal.cropservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public class SubscriptionRequest {
    @NotNull(message = "Subscriber ID is required") @Positive(message = "Subscriber ID must be positive")
    private Long subscriberId;
    @NotBlank(message = "Commodity is required") private String commodity;
    private String state;
    private String district;
    @Pattern(regexp = "(?i)A|B|C", message = "Grade must be A, B or C") private String grade;

    public Long getSubscriberId() { return subscriberId; }
    public void setSubscriberId(Long subscriberId) { this.subscriberId = subscriberId; }
    public String getCommodity() { return commodity; }
    public void setCommodity(String commodity) { this.commodity = commodity; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
}
