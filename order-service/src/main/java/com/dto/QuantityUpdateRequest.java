package com.dto;

import java.math.BigDecimal;

public class QuantityUpdateRequest {

    private BigDecimal purchasedQuantity;

    public QuantityUpdateRequest() {
    }

    public QuantityUpdateRequest(BigDecimal purchasedQuantity) {
        this.purchasedQuantity = purchasedQuantity;
    }

    public BigDecimal getPurchasedQuantity() {
        return purchasedQuantity;
    }

    public void setPurchasedQuantity(BigDecimal purchasedQuantity) {
        this.purchasedQuantity = purchasedQuantity;
    }
}
