package com.cropdeal.bidding.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class WalletDto {

    public static class WalletResponse {
        private Long id;
        private Long userId;
        private String userRole;
        private BigDecimal balance;
        private String currency;
        private List<WalletTransactionResponse> transactions;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getUserRole() { return userRole; }
        public void setUserRole(String userRole) { this.userRole = userRole; }
        public BigDecimal getBalance() { return balance; }
        public void setBalance(BigDecimal balance) { this.balance = balance; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public List<WalletTransactionResponse> getTransactions() { return transactions; }
        public void setTransactions(List<WalletTransactionResponse> transactions) { this.transactions = transactions; }
    }

    public static class WalletTransactionResponse {
        private Long id;
        private Long walletId;
        private Long userId;
        private BigDecimal amount;
        private String transactionType;
        private String referenceId;
        private String status;
        private String description;
        private LocalDateTime createdAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getWalletId() { return walletId; }
        public void setWalletId(Long walletId) { this.walletId = walletId; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getTransactionType() { return transactionType; }
        public void setTransactionType(String transactionType) { this.transactionType = transactionType; }
        public String getReferenceId() { return referenceId; }
        public void setReferenceId(String referenceId) { this.referenceId = referenceId; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }

    public static class WalletDebitRequest {
        private Long userId;
        private String userRole;
        private BigDecimal amount;
        private String referenceId;
        private String transactionType;
        private String description;

        public WalletDebitRequest() {}
        public WalletDebitRequest(Long userId, String userRole, BigDecimal amount, String referenceId, String transactionType, String description) {
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

    public static class WalletCreditRequest {
        private Long userId;
        private String userRole;
        private BigDecimal amount;
        private String referenceId;
        private String transactionType;
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
}