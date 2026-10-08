package com.cropdeal.report.dto;

import java.util.List;
import java.util.Map;

public class FarmerReportResponse {
    private long totalFarmers;
    private long activeFarmers;
    private long blockedFarmers;
    private long totalCropsSupplied;
    private double averageFarmerRating;
    private long totalReviewsReceived;
    private List<Map<String, Object>> topRatedFarmers;

    public FarmerReportResponse() {}

    public FarmerReportResponse(long totalFarmers, long activeFarmers, long blockedFarmers,
                                long totalCropsSupplied, double averageFarmerRating,
                                long totalReviewsReceived, List<Map<String, Object>> topRatedFarmers) {
        this.totalFarmers = totalFarmers;
        this.activeFarmers = activeFarmers;
        this.blockedFarmers = blockedFarmers;
        this.totalCropsSupplied = totalCropsSupplied;
        this.averageFarmerRating = averageFarmerRating;
        this.totalReviewsReceived = totalReviewsReceived;
        this.topRatedFarmers = topRatedFarmers;
    }

    public long getTotalFarmers() { return totalFarmers; }
    public void setTotalFarmers(long totalFarmers) { this.totalFarmers = totalFarmers; }

    public long getActiveFarmers() { return activeFarmers; }
    public void setActiveFarmers(long activeFarmers) { this.activeFarmers = activeFarmers; }

    public long getBlockedFarmers() { return blockedFarmers; }
    public void setBlockedFarmers(long blockedFarmers) { this.blockedFarmers = blockedFarmers; }

    public long getTotalCropsSupplied() { return totalCropsSupplied; }
    public void setTotalCropsSupplied(long totalCropsSupplied) { this.totalCropsSupplied = totalCropsSupplied; }

    public double getAverageFarmerRating() { return averageFarmerRating; }
    public void setAverageFarmerRating(double averageFarmerRating) { this.averageFarmerRating = averageFarmerRating; }

    public long getTotalReviewsReceived() { return totalReviewsReceived; }
    public void setTotalReviewsReceived(long totalReviewsReceived) { this.totalReviewsReceived = totalReviewsReceived; }

    public List<Map<String, Object>> getTopRatedFarmers() { return topRatedFarmers; }
    public void setTopRatedFarmers(List<Map<String, Object>> topRatedFarmers) { this.topRatedFarmers = topRatedFarmers; }
}
