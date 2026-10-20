package com.cropdeal.bidding.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bidding_listings")
public class BiddingListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long farmerId;

    @Column(nullable = false)
    private String cropName;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    @Column(nullable = false)
    private String unit; // KG, QUINTAL

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal basePrice; // Minimum acceptable price per unit

    @Column(precision = 12, scale = 2)
    private BigDecimal guidelinePrice;

    private String location;

    @Column(length = 1000)
    private String description;

    private String photoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BiddingStatus status = BiddingStatus.OPEN;

    private Long winningBidId;

    private Long winningDealerId;

    @Column(precision = 15, scale = 2)
    private BigDecimal highestBidAmount = BigDecimal.ZERO;

    @Version
    private Long version;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getFarmerId() { return farmerId; }
    public void setFarmerId(Long farmerId) { this.farmerId = farmerId; }

    public String getCropName() { return cropName; }
    public void setCropName(String cropName) { this.cropName = cropName; }

    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }

    public BigDecimal getGuidelinePrice() { return guidelinePrice; }
    public void setGuidelinePrice(BigDecimal guidelinePrice) { this.guidelinePrice = guidelinePrice; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public BiddingStatus getStatus() { return status; }
    public void setStatus(BiddingStatus status) { this.status = status; }

    public Long getWinningBidId() { return winningBidId; }
    public void setWinningBidId(Long winningBidId) { this.winningBidId = winningBidId; }

    public Long getWinningDealerId() { return winningDealerId; }
    public void setWinningDealerId(Long winningDealerId) { this.winningDealerId = winningDealerId; }

    public BigDecimal getHighestBidAmount() { return highestBidAmount; }
    public void setHighestBidAmount(BigDecimal highestBidAmount) { this.highestBidAmount = highestBidAmount; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}