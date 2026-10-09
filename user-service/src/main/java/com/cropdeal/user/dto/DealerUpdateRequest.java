package com.cropdeal.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class DealerUpdateRequest {

    @Size(min = 2, max = 100)
    private String name;

    @Pattern(
            regexp = "^[6-9][0-9]{9}$",
            message = "Invalid Indian mobile number"
    )
    private String phone;

    private String businessName;

    private String address;

    private String bankDetails;

    public DealerUpdateRequest() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getBankDetails() {
        return bankDetails;
    }

    public void setBankDetails(String bankDetails) {
        this.bankDetails = bankDetails;
    }
}