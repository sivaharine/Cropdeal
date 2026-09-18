package com.cropdeal.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class FarmerReviewRequest {

    @NotNull(message = "Order id is required")
    private Long orderId;

    @NotNull(message = "Crop id is required")
    private Long cropId;

    @NotNull(message = "Dealer id is required")
    private Long dealerId;

    @NotNull(message = "Farmer id is required")
    private Long farmerId;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating cannot exceed 5")
    private Integer rating;

    @NotBlank(message = "Review text is required")
    private String reviewText;

    public FarmerReviewRequest() {}

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
}