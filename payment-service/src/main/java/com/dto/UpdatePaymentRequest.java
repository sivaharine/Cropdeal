package com.dto;

import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;

public class UpdatePaymentRequest {

    private Long dealerId;

    private Long farmerId;

    @DecimalMin(value = "0.01")
    private BigDecimal amount;

    private String paymentMethod;

    public UpdatePaymentRequest() {
    }

    public Long getDealerId() {
        return dealerId;
    }

    public void setDealerId(Long dealerId) {
        this.dealerId = dealerId;
    }

    public Long getFarmerId() {
        return farmerId;
    }

    public void setFarmerId(Long farmerId) {
        this.farmerId = farmerId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}