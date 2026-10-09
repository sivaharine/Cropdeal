package com.cropdeal.report.dto;

import java.util.Map;

public class DeliveryPartnerReportResponse {
    private long totalDeliveryPartners;
    private long availablePartners;
    private long busyPartners;
    private long offlinePartners;
    private long totalDeliveriesCompleted;
    private double totalDeliveryFeesEarned;
    private Map<String, Long> vehicleDistribution;

    public DeliveryPartnerReportResponse() {}

    public DeliveryPartnerReportResponse(long totalDeliveryPartners, long availablePartners,
                                         long busyPartners, long offlinePartners,
                                         long totalDeliveriesCompleted, double totalDeliveryFeesEarned,
                                         Map<String, Long> vehicleDistribution) {
        this.totalDeliveryPartners = totalDeliveryPartners;
        this.availablePartners = availablePartners;
        this.busyPartners = busyPartners;
        this.offlinePartners = offlinePartners;
        this.totalDeliveriesCompleted = totalDeliveriesCompleted;
        this.totalDeliveryFeesEarned = totalDeliveryFeesEarned;
        this.vehicleDistribution = vehicleDistribution;
    }

    public long getTotalDeliveryPartners() { return totalDeliveryPartners; }
    public void setTotalDeliveryPartners(long totalDeliveryPartners) { this.totalDeliveryPartners = totalDeliveryPartners; }

    public long getAvailablePartners() { return availablePartners; }
    public void setAvailablePartners(long availablePartners) { this.availablePartners = availablePartners; }

    public long getBusyPartners() { return busyPartners; }
    public void setBusyPartners(long busyPartners) { this.busyPartners = busyPartners; }

    public long getOfflinePartners() { return offlinePartners; }
    public void setOfflinePartners(long offlinePartners) { this.offlinePartners = offlinePartners; }

    public long getTotalDeliveriesCompleted() { return totalDeliveriesCompleted; }
    public void setTotalDeliveriesCompleted(long totalDeliveriesCompleted) { this.totalDeliveriesCompleted = totalDeliveriesCompleted; }

    public double getTotalDeliveryFeesEarned() { return totalDeliveryFeesEarned; }
    public void setTotalDeliveryFeesEarned(double totalDeliveryFeesEarned) { this.totalDeliveryFeesEarned = totalDeliveryFeesEarned; }

    public Map<String, Long> getVehicleDistribution() { return vehicleDistribution; }
    public void setVehicleDistribution(Map<String, Long> vehicleDistribution) { this.vehicleDistribution = vehicleDistribution; }
}
