package com.cropdeal.review.dto;

public class OrderDto {
    private Long id;
    private Long farmerId;
    private Long dealerId;
    private Long cropId;
    private String cropName;
    private String status;

    public OrderDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getFarmerId() { return farmerId; }
    public void setFarmerId(Long farmerId) { this.farmerId = farmerId; }
    public Long getDealerId() { return dealerId; }
    public void setDealerId(Long dealerId) { this.dealerId = dealerId; }
    public Long getCropId() { return cropId; }
    public void setCropId(Long cropId) { this.cropId = cropId; }
    public String getCropName() { return cropName; }
    public void setCropName(String cropName) { this.cropName = cropName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}