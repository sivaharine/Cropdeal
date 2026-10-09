package com.cropdeal.report.dto;

import java.util.Map;

public class PaymentReportResponse {
    private long totalTransactions;
    private double totalRevenue;
    private long successfulPayments;
    private long failedPayments;
    private double totalDeliveryFeesCollected;
    private Map<String, Long> paymentMethodBreakdown;
    private String currency = "INR";

    public PaymentReportResponse() {}

    public PaymentReportResponse(long totalTransactions, double totalRevenue, long successfulPayments,
                                 long failedPayments, double totalDeliveryFeesCollected,
                                 Map<String, Long> paymentMethodBreakdown) {
        this.totalTransactions = totalTransactions;
        this.totalRevenue = totalRevenue;
        this.successfulPayments = successfulPayments;
        this.failedPayments = failedPayments;
        this.totalDeliveryFeesCollected = totalDeliveryFeesCollected;
        this.paymentMethodBreakdown = paymentMethodBreakdown;
    }

    public long getTotalTransactions() { return totalTransactions; }
    public void setTotalTransactions(long totalTransactions) { this.totalTransactions = totalTransactions; }

    public double getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(double totalRevenue) { this.totalRevenue = totalRevenue; }

    public long getSuccessfulPayments() { return successfulPayments; }
    public void setSuccessfulPayments(long successfulPayments) { this.successfulPayments = successfulPayments; }

    public long getFailedPayments() { return failedPayments; }
    public void setFailedPayments(long failedPayments) { this.failedPayments = failedPayments; }

    public double getTotalDeliveryFeesCollected() { return totalDeliveryFeesCollected; }
    public void setTotalDeliveryFeesCollected(double totalDeliveryFeesCollected) { this.totalDeliveryFeesCollected = totalDeliveryFeesCollected; }

    public Map<String, Long> getPaymentMethodBreakdown() { return paymentMethodBreakdown; }
    public void setPaymentMethodBreakdown(Map<String, Long> paymentMethodBreakdown) { this.paymentMethodBreakdown = paymentMethodBreakdown; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}
