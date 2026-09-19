package com.cropdeal.user.entity;

import com.cropdeal.user.enums.DeliveryPartnerStatus;
import com.cropdeal.user.enums.Role;
import com.cropdeal.user.enums.VehicleType;
import jakarta.persistence.*;

@Entity
@Table(
        name = "delivery_partners",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_delivery_user_id",
                        columnNames = "user_id"
                )
        }
)
public class DeliveryPartner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "user_id",
            nullable = false,
            unique = true
    )
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 10)
    private String phone;

    private String email;

    @Enumerated(EnumType.STRING)
    private Role role;

    private String address;

    @Column(unique = true)
    private String vehicleNumber;

    @Enumerated(EnumType.STRING)
    private VehicleType vehicleType;

    @Column(unique = true)
    private String drivingLicenseNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryPartnerStatus availabilityStatus;

    @Column(length = 500)
    private String bankDetails;

    public DeliveryPartner() {
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }

    public String getDrivingLicenseNumber() {
        return drivingLicenseNumber;
    }

    public void setDrivingLicenseNumber(
            String drivingLicenseNumber
    ) {
        this.drivingLicenseNumber = drivingLicenseNumber;
    }

    public DeliveryPartnerStatus getAvailabilityStatus() {
        return availabilityStatus;
    }

    public void setAvailabilityStatus(
            DeliveryPartnerStatus availabilityStatus
    ) {
        this.availabilityStatus = availabilityStatus;
    }

    public String getBankDetails() {
        return bankDetails;
    }

    public void setBankDetails(String bankDetails) {
        this.bankDetails = bankDetails;
    }
}
