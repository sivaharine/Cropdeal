package com.dto;

import jakarta.validation.constraints.NotBlank;

public class PayOrderRequest {

    @NotBlank
    private String paymentMethod;

    public PayOrderRequest() {
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}