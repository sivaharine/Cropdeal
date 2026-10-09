package com.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class WalletTopUpRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    private String userRole;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Top-up amount must be at least 1.00")
    private BigDecimal amount;

    private String paymentMethod = "UPI";

    private String transactionReference;

    public WalletTopUpRequest() {}

    public WalletTopUpRequest(Long userId, String userRole, BigDecimal amount, String paymentMethod, String transactionReference) {
        this.userId = userId;
        this.userRole = userRole;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.transactionReference = transactionReference;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }
}