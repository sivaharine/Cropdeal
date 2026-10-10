package com.cropdeal.user.dto;

public class FarmerResponse {

    private Long id;
    private Long userId;
    private String name;
    private String phone;
    private String address;
    private String farmLocation;
    private String bankDetails;

    public FarmerResponse() {
    }

    public FarmerResponse(
            Long id,
            Long userId,
            String name,
            String phone,
            String address,
            String farmLocation,
            String bankDetails
    ) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.phone = phone;
        this.address = address;
        this.farmLocation = farmLocation;
        this.bankDetails = bankDetails;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public String getPhone() {
        return phone;
    }

    public String getAddress() {
        return address;
    }

    public String getFarmLocation() {
        return farmLocation;
    }

    public String getBankDetails() {
        return bankDetails;
    }
}