package com.cropdeal.report.dto;

import java.util.List;
import java.util.Map;

public class DealerReportResponse {
    private long totalDealers;
    private long activeDealers;
    private long totalOrdersPlaced;
    private double totalAmountSpent;
    private double averageSpendPerDealer;
    private List<Map<String, Object>> topDealers;

    public DealerReportResponse() {}

    public DealerReportResponse(long totalDealers, long activeDealers, long totalOrdersPlaced,
                                double totalAmountSpent, double averageSpendPerDealer,
                                List<Map<String, Object>> topDealers) {
        this.totalDealers = totalDealers;
        this.activeDealers = activeDealers;
        this.totalOrdersPlaced = totalOrdersPlaced;
        this.totalAmountSpent = totalAmountSpent;
        this.averageSpendPerDealer = averageSpendPerDealer;
        this.topDealers = topDealers;
    }

    public long getTotalDealers() { return totalDealers; }
    public void setTotalDealers(long totalDealers) { this.totalDealers = totalDealers; }

    public long getActiveDealers() { return activeDealers; }
    public void setActiveDealers(long activeDealers) { this.activeDealers = activeDealers; }

    public long getTotalOrdersPlaced() { return totalOrdersPlaced; }
    public void setTotalOrdersPlaced(long totalOrdersPlaced) { this.totalOrdersPlaced = totalOrdersPlaced; }

    public double getTotalAmountSpent() { return totalAmountSpent; }
    public void setTotalAmountSpent(double totalAmountSpent) { this.totalAmountSpent = totalAmountSpent; }

    public double getAverageSpendPerDealer() { return averageSpendPerDealer; }
    public void setAverageSpendPerDealer(double averageSpendPerDealer) { this.averageSpendPerDealer = averageSpendPerDealer; }

    public List<Map<String, Object>> getTopDealers() { return topDealers; }
    public void setTopDealers(List<Map<String, Object>> topDealers) { this.topDealers = topDealers; }
}
