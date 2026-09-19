package com.cropdeal.delivery.dto;

import java.math.BigDecimal;

public class WalletSettlementRequest {
    private Long userId;
    private String userRole;
    private BigDecimal amount;
    private String referenceId;
    private String description;

    public WalletSettlementRequest() {}

    public WalletSettlementRequest(Long userId, String userRole, BigDecimal amount, String referenceId, String description) {
        this.userId = userId;
        this.userRole = userRole;
        this.amount = amount;
        this.referenceId = referenceId;
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
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}