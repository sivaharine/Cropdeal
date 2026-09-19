package com.cropdeal.review.dto;

import java.util.List;

public class FarmerRatingSummaryResponse {

    private Long farmerId;
    private Double averageRating;
    private Integer totalReviews;
    private List<FarmerReviewResponse> reviews;

    public FarmerRatingSummaryResponse() {}

    public Long getFarmerId() { return farmerId; }
    public void setFarmerId(Long farmerId) { this.farmerId = farmerId; }
    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }
    public Integer getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Integer totalReviews) { this.totalReviews = totalReviews; }
    public List<FarmerReviewResponse> getReviews() { return reviews; }
    public void setReviews(List<FarmerReviewResponse> reviews) { this.reviews = reviews; }
}