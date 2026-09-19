package com.dto;

import java.math.BigDecimal;
import java.util.List;

public class WalletResponse {

    private Long id;
    private Long userId;
    private String userRole;
    private BigDecimal balance;
    private String currency;
    private List<WalletTransactionResponse> transactions;

    public WalletResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserRole() {
        return userRole;
    }

    public void setUserRole(String userRole) {
        this.userRole = userRole;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public List<WalletTransactionResponse> getTransactions() {
        return transactions;
    }

    public void setTransactions(List<WalletTransactionResponse> transactions) {
        this.transactions = transactions;
    }
}