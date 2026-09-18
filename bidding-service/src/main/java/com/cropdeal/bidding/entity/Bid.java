package com.cropdeal.bidding.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bids", indexes = {
        @Index(name = "idx_bid_session_id", columnList = "session_id"),
        @Index(name = "idx_bid_dealer_id", columnList = "dealerId"),
        @Index(name = "idx_bid_status", columnList = "status")
})
public class Bid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    @JsonIgnore
    private BiddingSession session;

    @Column(nullable = false)
    private Long dealerId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal bidAmount;

    @Column(nullable = false)
    private LocalDateTime bidTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BidStatus status = BidStatus.ACCEPTED;

    @Column(length = 100)
    private String walletHoldRef;

    @Column(length = 500)
    private String notes;

    @PrePersist
    void onCreate() {
        bidTime = LocalDateTime.now();
        if (status == null) status = BidStatus.ACCEPTED;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BiddingSession getSession() { return session; }
    public void setSession(BiddingSession session) { this.session = session; }

    public Long getDealerId() { return dealerId; }
    public void setDealerId(Long dealerId) { this.dealerId = dealerId; }

    public BigDecimal getBidAmount() { return bidAmount; }
    public void setBidAmount(BigDecimal bidAmount) { this.bidAmount = bidAmount; }

    public LocalDateTime getBidTime() { return bidTime; }
    public void setBidTime(LocalDateTime bidTime) { this.bidTime = bidTime; }

    public BidStatus getStatus() { return status; }
    public void setStatus(BidStatus status) { this.status = status; }

    public String getWalletHoldRef() { return walletHoldRef; }
    public void setWalletHoldRef(String walletHoldRef) { this.walletHoldRef = walletHoldRef; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}