package com.cropdeal.report.dto;

import java.util.List;
import java.util.Map;

public class CropReportResponse {
    private long totalCropsListed;
    private long activeListings;
    private double totalStockQuantityKg;
    private double averagePricePerKg;
    private Map<String, Long> categoryDistribution;
    private List<Map<String, Object>> topCropsByVolume;

    public CropReportResponse() {}

    public CropReportResponse(long totalCropsListed, long activeListings, double totalStockQuantityKg,
                              double averagePricePerKg, Map<String, Long> categoryDistribution,
                              List<Map<String, Object>> topCropsByVolume) {
        this.totalCropsListed = totalCropsListed;
        this.activeListings = activeListings;
        this.totalStockQuantityKg = totalStockQuantityKg;
        this.averagePricePerKg = averagePricePerKg;
        this.categoryDistribution = categoryDistribution;
        this.topCropsByVolume = topCropsByVolume;
    }

    public long getTotalCropsListed() { return totalCropsListed; }
    public void setTotalCropsListed(long totalCropsListed) { this.totalCropsListed = totalCropsListed; }

    public long getActiveListings() { return activeListings; }
    public void setActiveListings(long activeListings) { this.activeListings = activeListings; }

    public double getTotalStockQuantityKg() { return totalStockQuantityKg; }
    public void setTotalStockQuantityKg(double totalStockQuantityKg) { this.totalStockQuantityKg = totalStockQuantityKg; }

    public double getAveragePricePerKg() { return averagePricePerKg; }
    public void setAveragePricePerKg(double averagePricePerKg) { this.averagePricePerKg = averagePricePerKg; }

    public Map<String, Long> getCategoryDistribution() { return categoryDistribution; }
    public void setCategoryDistribution(Map<String, Long> categoryDistribution) { this.categoryDistribution = categoryDistribution; }

    public List<Map<String, Object>> getTopCropsByVolume() { return topCropsByVolume; }
    public void setTopCropsByVolume(List<Map<String, Object>> topCropsByVolume) { this.topCropsByVolume = topCropsByVolume; }
}
