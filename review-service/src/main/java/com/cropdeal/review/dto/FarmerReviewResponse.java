package com.cropdeal.review.dto;

import java.time.LocalDateTime;

public class FarmerReviewResponse {

    private Long id;
    private String reviewReference;
    private Long orderId;
    private Long cropId;
    private Long dealerId;
    private Long farmerId;
    private Integer rating;
    private String reviewText;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public FarmerReviewResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getReviewReference() { return reviewReference; }
    public void setReviewReference(String reviewReference) { this.reviewReference = reviewReference; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public Long getCropId() { return cropId; }
    public void setCropId(Long cropId) { this.cropId = cropId; }
    public Long getDealerId() { return dealerId; }
    public void setDealerId(Long dealerId) { this.dealerId = dealerId; }
    public Long getFarmerId() { return farmerId; }
    public void setFarmerId(Long farmerId) { this.farmerId = farmerId; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public String getReviewText() { return reviewText; }
    public void setReviewText(String reviewText) { this.reviewText = reviewText; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}