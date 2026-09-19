package com.cropdeal.bidding.dto;

import com.cropdeal.bidding.entity.BidStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BidResponse {
    private Long id;
    private Long sessionId;
    private Long dealerId;
    private BigDecimal bidAmount;
    private LocalDateTime bidTime;
    private BidStatus status;
    private String walletHoldRef;
    private String notes;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }

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