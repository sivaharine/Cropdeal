package com.dto;

import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;

public class UpdateRefundRequest {

    private Long deliveryId;

    @DecimalMin(value = "0.01")
    private BigDecimal refundAmount;

    private String reason;

    public UpdateRefundRequest() {
    }

    public Long getDeliveryId() {
        return deliveryId;
    }

    public void setDeliveryId(Long deliveryId) {
        this.deliveryId = deliveryId;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount;
    }

    public void setRefundAmount(BigDecimal refundAmount) {
        this.refundAmount = refundAmount;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}