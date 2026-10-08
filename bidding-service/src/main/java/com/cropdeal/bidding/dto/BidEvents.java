package com.cropdeal.bidding.dto;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BidEvents {

    public static class BidPlacedEvent implements Serializable {
        private Long sessionId;
        private Long cropId;
        private Long farmerId;
        private Long dealerId;
        private BigDecimal bidAmount;
        private LocalDateTime timestamp;

        public BidPlacedEvent() {}
        public BidPlacedEvent(Long sessionId, Long cropId, Long farmerId, Long dealerId, BigDecimal bidAmount) {
            this.sessionId = sessionId;
            this.cropId = cropId;
            this.farmerId = farmerId;
            this.dealerId = dealerId;
            this.bidAmount = bidAmount;
            this.timestamp = LocalDateTime.now();
        }

        public Long getSessionId() { return sessionId; }
        public Long getCropId() { return cropId; }
        public Long getFarmerId() { return farmerId; }
        public Long getDealerId() { return dealerId; }
        public BigDecimal getBidAmount() { return bidAmount; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }

    public static class BidOutbidEvent implements Serializable {
        private Long sessionId;
        private Long previousBidderId;
        private BigDecimal refundedAmount;
        private BigDecimal newHighestBid;

        public BidOutbidEvent() {}
        public BidOutbidEvent(Long sessionId, Long previousBidderId, BigDecimal refundedAmount, BigDecimal newHighestBid) {
            this.sessionId = sessionId;
            this.previousBidderId = previousBidderId;
            this.refundedAmount = refundedAmount;
            this.newHighestBid = newHighestBid;
        }

        public Long getSessionId() { return sessionId; }
        public Long getPreviousBidderId() { return previousBidderId; }
        public BigDecimal getRefundedAmount() { return refundedAmount; }
        public BigDecimal getNewHighestBid() { return newHighestBid; }
    }

    public static class BidWonEvent implements Serializable {
        private Long sessionId;
        private Long cropId;
        private Long farmerId;
        private Long winnerDealerId;
        private BigDecimal winningAmount;
        private BigDecimal quantity;

        public BidWonEvent() {}
        public BidWonEvent(Long sessionId, Long cropId, Long farmerId, Long winnerDealerId, BigDecimal winningAmount, BigDecimal quantity) {
            this.sessionId = sessionId;
            this.cropId = cropId;
            this.farmerId = farmerId;
            this.winnerDealerId = winnerDealerId;
            this.winningAmount = winningAmount;
            this.quantity = quantity;
        }

        public Long getSessionId() { return sessionId; }
        public Long getCropId() { return cropId; }
        public Long getFarmerId() { return farmerId; }
        public Long getWinnerDealerId() { return winnerDealerId; }
        public BigDecimal getWinningAmount() { return winningAmount; }
        public BigDecimal getQuantity() { return quantity; }
    }
}