package com.cropdeal.user.dto;

import com.cropdeal.user.enums.DeliveryPartnerStatus;
import com.cropdeal.user.enums.Role;
import com.cropdeal.user.enums.VehicleType;

public class DeliveryPartnerResponse {

    private Long id;
    private Long userId;
    private String name;
    private String phone;
    private String email;
    private Role role;
    private String address;
    private String vehicleNumber;
    private VehicleType vehicleType;
    private String drivingLicenseNumber;
    private DeliveryPartnerStatus availabilityStatus;
    private String bankDetails;

    public DeliveryPartnerResponse() {
    }

    public DeliveryPartnerResponse(
            Long id,
            Long userId,
            String name,
            String phone,
            String address,
            String vehicleNumber,
            VehicleType vehicleType,
            String drivingLicenseNumber,
            DeliveryPartnerStatus availabilityStatus,
            String bankDetails
    ) {
        this(id, userId, name, phone, null, null, address, vehicleNumber, vehicleType, drivingLicenseNumber,
                availabilityStatus, bankDetails);
    }

    public DeliveryPartnerResponse(
            Long id,
            Long userId,
            String name,
            String phone,
            String email,
            Role role,
            String address,
            String vehicleNumber,
            VehicleType vehicleType,
            String drivingLicenseNumber,
            DeliveryPartnerStatus availabilityStatus,
            String bankDetails
    ) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.role = role;
        this.address = address;
        this.vehicleNumber = vehicleNumber;
        this.vehicleType = vehicleType;
        this.drivingLicenseNumber = drivingLicenseNumber;
        this.availabilityStatus = availabilityStatus;
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

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public String getDrivingLicenseNumber() {
        return drivingLicenseNumber;
    }

    public DeliveryPartnerStatus getAvailabilityStatus() {
        return availabilityStatus;
    }

    public String getBankDetails() {
        return bankDetails;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }

    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }

    public void setDrivingLicenseNumber(String drivingLicenseNumber) {
        this.drivingLicenseNumber = drivingLicenseNumber;
    }

    public void setAvailabilityStatus(DeliveryPartnerStatus availabilityStatus) {
        this.availabilityStatus = availabilityStatus;
    }

    public void setBankDetails(String bankDetails) {
        this.bankDetails = bankDetails;
    }
}
