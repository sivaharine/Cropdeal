package com.cropdeal.admin.service;

import com.cropdeal.admin.dto.report.*;

import java.util.List;

public interface ReportService {
    List<FarmerReportItem> getFarmersReport();
    byte[] exportFarmersReportCsv();

    List<DealerReportItem> getDealersReport();
    byte[] exportDealersReportCsv();

    List<CropReportItem> getCropsReport();
    byte[] exportCropsReportCsv();

    List<OrderReportItem> getOrdersReport();
    byte[] exportOrdersReportCsv();

    List<PaymentReportItem> getPaymentsReport();
    byte[] exportPaymentsReportCsv();
}
