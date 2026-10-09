package com.cropdeal.report.service;

import com.cropdeal.report.dto.*;

public interface ReportService {

    PaymentReportResponse getPaymentReport();

    DealerReportResponse getDealerReport();

    FarmerReportResponse getFarmerReport();

    DeliveryPartnerReportResponse getDeliveryPartnerReport();

    CropReportResponse getCropReport();

    ExecutiveDashboardReport getExecutiveDashboard();
}
