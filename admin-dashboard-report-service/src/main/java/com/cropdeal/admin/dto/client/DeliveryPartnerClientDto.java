package com.cropdeal.admin.dto.client;

public class DeliveryPartnerClientDto {
    private Long id;
    private Long userId;
    private String name;
    private String phone;
    private String vehicleNumber;
    private String vehicleType;
    private String operationalArea;
    private String status;

    public DeliveryPartnerClientDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }
    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
    public String getOperationalArea() { return operationalArea; }
    public void setOperationalArea(String operationalArea) { this.operationalArea = operationalArea; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
