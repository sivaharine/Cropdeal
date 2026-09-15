package com.cropdeal.cropservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class QuantityUpdateRequest {
    @NotNull(message = "Purchased quantity is required")
    @DecimalMin(value = "0.001", message = "Purchased quantity must be greater than zero")
    private BigDecimal purchasedQuantity;

    public BigDecimal getPurchasedQuantity() { return purchasedQuantity; }
    public void setPurchasedQuantity(BigDecimal purchasedQuantity) { this.purchasedQuantity = purchasedQuantity; }
}
