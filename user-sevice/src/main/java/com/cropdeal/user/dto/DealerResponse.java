package com.cropdeal.user.dto;

public class DealerResponse {

    private Long id;
    private Long userId;
    private String name;
    private String phone;
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
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.phone = phone;
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