package com.example.notification.dto;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BiddingNotificationEvents {

    public static class BidPlacedNotificationEvent implements Serializable {
        private Long sessionId;
        private Long cropId;
        private Long farmerId;
        private Long dealerId;
        private BigDecimal bidAmount;
        private LocalDateTime timestamp;

        public Long getSessionId() { return sessionId; }
        public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
        public Long getCropId() { return cropId; }
        public void setCropId(Long cropId) { this.cropId = cropId; }
        public Long getFarmerId() { return farmerId; }
        public void setFarmerId(Long farmerId) { this.farmerId = farmerId; }
        public Long getDealerId() { return dealerId; }
        public void setDealerId(Long dealerId) { this.dealerId = dealerId; }
        public BigDecimal getBidAmount() { return bidAmount; }
        public void setBidAmount(BigDecimal bidAmount) { this.bidAmount = bidAmount; }
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    }

    public static class BidOutbidNotificationEvent implements Serializable {
        private Long sessionId;
        private Long previousBidderId;
        private BigDecimal refundedAmount;
        private BigDecimal newHighestBid;

        public Long getSessionId() { return sessionId; }
        public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
        public Long getPreviousBidderId() { return previousBidderId; }
        public void setPreviousBidderId(Long previousBidderId) { this.previousBidderId = previousBidderId; }
        public BigDecimal getRefundedAmount() { return refundedAmount; }
        public void setRefundedAmount(BigDecimal refundedAmount) { this.refundedAmount = refundedAmount; }
        public BigDecimal getNewHighestBid() { return newHighestBid; }
        public void setNewHighestBid(BigDecimal newHighestBid) { this.newHighestBid = newHighestBid; }
    }

    public static class BidWonNotificationEvent implements Serializable {
        private Long sessionId;
        private Long cropId;
        private Long farmerId;
        private Long winnerDealerId;
        private BigDecimal winningAmount;
        private BigDecimal quantity;

        public Long getSessionId() { return sessionId; }
        public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
        public Long getCropId() { return cropId; }
        public void setCropId(Long cropId) { this.cropId = cropId; }
        public Long getFarmerId() { return farmerId; }
        public void setFarmerId(Long farmerId) { this.farmerId = farmerId; }
        public Long getWinnerDealerId() { return winnerDealerId; }
        public void setWinnerDealerId(Long winnerDealerId) { this.winnerDealerId = winnerDealerId; }
        public BigDecimal getWinningAmount() { return winningAmount; }
        public void setWinningAmount(BigDecimal winningAmount) { this.winningAmount = winningAmount; }
        public BigDecimal getQuantity() { return quantity; }
        public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    }
}