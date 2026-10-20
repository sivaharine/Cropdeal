package com.cropdeal.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class FarmerUpdateRequest {

    @Size(min = 2, max = 100)
    private String name;

    @Pattern(
            regexp = "^[6-9][0-9]{9}$",
            message = "Invalid Indian mobile number"
    )
    private String phone;

    private String address;

    private String farmLocation;

    private String bankDetails;

    public FarmerUpdateRequest() {
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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getFarmLocation() {
        return farmLocation;
    }

    public void setFarmLocation(String farmLocation) {
        this.farmLocation = farmLocation;
    }

    public String getBankDetails() {
        return bankDetails;
    }

    public void setBankDetails(String bankDetails) {
        this.bankDetails = bankDetails;
    }
}