package com.cropdeal.bidding.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bids", indexes = {
    @Index(name = "idx_bid_listing", columnList = "listingId"),
    @Index(name = "idx_bid_dealer", columnList = "dealerId")
})
public class Bid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long listingId;

    @Column(nullable = false)
    private Long dealerId;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal bidAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BidStatus status = BidStatus.ACTIVE;

    @Column(nullable = false)
    private LocalDateTime bidTime;

    @PrePersist
    void prePersist() {
        bidTime = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getListingId() { return listingId; }
    public void setListingId(Long listingId) { this.listingId = listingId; }

    public Long getDealerId() { return dealerId; }
    public void setDealerId(Long dealerId) { this.dealerId = dealerId; }

    public BigDecimal getBidAmount() { return bidAmount; }
    public void setBidAmount(BigDecimal bidAmount) { this.bidAmount = bidAmount; }

    public BidStatus getStatus() { return status; }
    public void setStatus(BidStatus status) { this.status = status; }

    public LocalDateTime getBidTime() { return bidTime; }
    public void setBidTime(LocalDateTime bidTime) { this.bidTime = bidTime; }
}