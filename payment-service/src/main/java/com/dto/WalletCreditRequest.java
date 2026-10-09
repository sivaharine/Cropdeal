package com.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class WalletCreditRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    private String userRole;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotBlank(message = "Reference ID is required")
    private String referenceId;

    private String transactionType = "CREDIT";

    private String description;

    public WalletCreditRequest() {}

    public WalletCreditRequest(Long userId, String userRole, BigDecimal amount, String referenceId, String transactionType, String description) {
        this.userId = userId;
        this.userRole = userRole;
        this.amount = amount;
        this.referenceId = referenceId;
        this.transactionType = transactionType;
        this.description = description;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public String getTransactionType() { return transactionType; }
    public void setTransactionType(String transactionType) { this.transactionType = transactionType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}