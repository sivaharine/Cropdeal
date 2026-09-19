package com.cropdeal.user.dto;

import com.cropdeal.user.enums.Role;

public class FarmerResponse {

    private Long id;
    private Long userId;
    private String name;
    private String phone;
    private String email;
    private Role role;
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
        this(id, userId, name, phone, null, null, address, farmLocation, bankDetails);
    }

    public FarmerResponse(
            Long id,
            Long userId,
            String name,
            String phone,
            String email,
            Role role,
            String address,
            String farmLocation,
            String bankDetails
    ) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.role = role;
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

    public String getEmail() {
        return email;
    }

    public Role getRole() {
        return role;
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
