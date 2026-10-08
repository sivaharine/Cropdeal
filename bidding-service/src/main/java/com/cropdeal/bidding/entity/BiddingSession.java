package com.cropdeal.bidding.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bidding_sessions", indexes = {
        @Index(name = "idx_bs_crop_id", columnList = "crop_id"),
        @Index(name = "idx_bs_farmer_id", columnList = "farmer_id"),
        @Index(name = "idx_bs_status", columnList = "status"),
        @Index(name = "idx_bs_end_time", columnList = "end_time")
})
public class BiddingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long cropId;

    @Column(nullable = false)
    private Long farmerId;

    @Column(nullable = false, length = 100)
    private String cropName;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantity;

    @Column(nullable = false, length = 20)
    private String unit = "KG";

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal basePrice;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal minIncrement = BigDecimal.valueOf(1.00);

    @Column(precision = 12, scale = 2)
    private BigDecimal currentHighestBid;

    private Long highestBidderId;

    private Long highestBidId;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BiddingSessionStatus status = BiddingSessionStatus.ACTIVE;

    @Column(length = 100)
    private String district;

    @Column(length = 100)
    private String state;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Bid> bids = new ArrayList<>();

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (status == null) status = BiddingSessionStatus.ACTIVE;
        if (minIncrement == null) minIncrement = BigDecimal.valueOf(1.00);
        if (unit == null || unit.isBlank()) unit = "KG";
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCropId() { return cropId; }
    public void setCropId(Long cropId) { this.cropId = cropId; }

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

    public BigDecimal getMinIncrement() { return minIncrement; }
    public void setMinIncrement(BigDecimal minIncrement) { this.minIncrement = minIncrement; }

    public BigDecimal getCurrentHighestBid() { return currentHighestBid; }
    public void setCurrentHighestBid(BigDecimal currentHighestBid) { this.currentHighestBid = currentHighestBid; }

    public Long getHighestBidderId() { return highestBidderId; }
    public void setHighestBidderId(Long highestBidderId) { this.highestBidderId = highestBidderId; }

    public Long getHighestBidId() { return highestBidId; }
    public void setHighestBidId(Long highestBidId) { this.highestBidId = highestBidId; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public BiddingSessionStatus getStatus() { return status; }
    public void setStatus(BiddingSessionStatus status) { this.status = status; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<Bid> getBids() { return bids; }
    public void setBids(List<Bid> bids) { this.bids = bids; }
}
