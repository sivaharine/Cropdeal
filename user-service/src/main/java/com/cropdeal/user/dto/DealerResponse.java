package com.cropdeal.user.dto;

import com.cropdeal.user.enums.Role;

public class DealerResponse {

    private Long id;
    private Long userId;
    private String name;
    private String phone;
    private String email;
    private Role role;
    private String businessName;
    private String address;
    private String bankDetails;

    public DealerResponse() {
    }

    public DealerResponse(
            Long id,
            Long userId,
            String name,
            String phone,
            String businessName,
            String address,
            String bankDetails
    ) {
        this(id, userId, name, phone, null, null, businessName, address, bankDetails);
    }

    public DealerResponse(
            Long id,
            Long userId,
            String name,
            String phone,
            String email,
            Role role,
            String businessName,
            String address,
            String bankDetails
    ) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.role = role;
        this.businessName = businessName;
        this.address = address;
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

    public String getBusinessName() {
        return businessName;
    }

    public String getAddress() {
        return address;
    }

    public String getBankDetails() {
        return bankDetails;
    }
}
