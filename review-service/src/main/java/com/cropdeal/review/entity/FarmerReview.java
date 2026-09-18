package com.cropdeal.review.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "farmer_reviews", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"dealerId", "orderId"})
})
public class FarmerReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String reviewReference;

    @Column(nullable = false)
    private Long orderId;

    @Column(nullable = false)
    private Long cropId;

    @Column(nullable = false)
    private Long dealerId;

    @Column(nullable = false)
    private Long farmerId;

    @Column(nullable = false)
    private Integer rating; // 1 - 5

    @Column(nullable = false, length = 2000)
    private String reviewText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReviewStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public FarmerReview() {
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = ReviewStatus.ACTIVE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

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
    public ReviewStatus getStatus() { return status; }
    public void setStatus(ReviewStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}