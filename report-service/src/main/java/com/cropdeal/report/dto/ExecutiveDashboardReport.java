package com.cropdeal.report.dto;

public class ExecutiveDashboardReport {
    private PaymentReportResponse paymentSummary;
    private DealerReportResponse dealerSummary;
    private FarmerReportResponse farmerSummary;
    private DeliveryPartnerReportResponse deliveryPartnerSummary;
    private CropReportResponse cropSummary;
    private String generatedAt;

    public ExecutiveDashboardReport() {}

    public ExecutiveDashboardReport(PaymentReportResponse paymentSummary,
                                    DealerReportResponse dealerSummary,
                                    FarmerReportResponse farmerSummary,
                                    DeliveryPartnerReportResponse deliveryPartnerSummary,
                                    CropReportResponse cropSummary,
                                    String generatedAt) {
        this.paymentSummary = paymentSummary;
        this.dealerSummary = dealerSummary;
        this.farmerSummary = farmerSummary;
        this.deliveryPartnerSummary = deliveryPartnerSummary;
        this.cropSummary = cropSummary;
        this.generatedAt = generatedAt;
    }

    public PaymentReportResponse getPaymentSummary() { return paymentSummary; }
    public void setPaymentSummary(PaymentReportResponse paymentSummary) { this.paymentSummary = paymentSummary; }

    public DealerReportResponse getDealerSummary() { return dealerSummary; }
    public void setDealerSummary(DealerReportResponse dealerSummary) { this.dealerSummary = dealerSummary; }

    public FarmerReportResponse getFarmerSummary() { return farmerSummary; }
    public void setFarmerSummary(FarmerReportResponse farmerSummary) { this.farmerSummary = farmerSummary; }

    public DeliveryPartnerReportResponse getDeliveryPartnerSummary() { return deliveryPartnerSummary; }
    public void setDeliveryPartnerSummary(DeliveryPartnerReportResponse deliveryPartnerSummary) { this.deliveryPartnerSummary = deliveryPartnerSummary; }

    public CropReportResponse getCropSummary() { return cropSummary; }
    public void setCropSummary(CropReportResponse cropSummary) { this.cropSummary = cropSummary; }

    public String getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(String generatedAt) { this.generatedAt = generatedAt; }
}
