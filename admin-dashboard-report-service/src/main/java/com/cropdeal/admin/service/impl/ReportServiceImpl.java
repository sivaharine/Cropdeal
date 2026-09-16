package com.cropdeal.admin.service.impl;

import com.cropdeal.admin.client.CropServiceClient;
import com.cropdeal.admin.client.OrderServiceClient;
import com.cropdeal.admin.client.PaymentServiceClient;
import com.cropdeal.admin.client.UserServiceClient;
import com.cropdeal.admin.dto.client.CropClientDto;
import com.cropdeal.admin.dto.client.DealerClientDto;
import com.cropdeal.admin.dto.client.FarmerClientDto;
import com.cropdeal.admin.dto.client.OrderClientDto;
import com.cropdeal.admin.dto.client.PaymentClientDto;
import com.cropdeal.admin.dto.report.*;
import com.cropdeal.admin.entity.ReportRecord;
import com.cropdeal.admin.repository.ReportRecordRepository;
import com.cropdeal.admin.service.ReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class ReportServiceImpl implements ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportServiceImpl.class);

    private final UserServiceClient userServiceClient;
    private final CropServiceClient cropServiceClient;
    private final OrderServiceClient orderServiceClient;
    private final PaymentServiceClient paymentServiceClient;
    private final ReportRecordRepository reportRecordRepository;

    public ReportServiceImpl(
            UserServiceClient userServiceClient,
            CropServiceClient cropServiceClient,
            OrderServiceClient orderServiceClient,
            PaymentServiceClient paymentServiceClient,
            ReportRecordRepository reportRecordRepository
    ) {
        this.userServiceClient = userServiceClient;
        this.cropServiceClient = cropServiceClient;
        this.orderServiceClient = orderServiceClient;
        this.paymentServiceClient = paymentServiceClient;
        this.reportRecordRepository = reportRecordRepository;
    }

    @Override
    public List<FarmerReportItem> getFarmersReport() {
        List<FarmerClientDto> farmers = safeFetch(userServiceClient::getAllFarmers, Collections.emptyList());
        List<CropClientDto> crops = safeFetch(cropServiceClient::searchCrops, Collections.emptyList());

        Map<Long, List<CropClientDto>> cropsByFarmer = new HashMap<>();
        for (CropClientDto c : crops) {
            if (c.getFarmerId() != null) {
                cropsByFarmer.computeIfAbsent(c.getFarmerId(), k -> new ArrayList<>()).add(c);
            }
        }

        List<FarmerReportItem> report = new ArrayList<>();
        for (FarmerClientDto f : farmers) {
            List<CropClientDto> farmerCrops = cropsByFarmer.getOrDefault(f.getUserId(), Collections.emptyList());
            long totalCrops = farmerCrops.size();
            BigDecimal estimatedValue = farmerCrops.stream()
                    .filter(c -> c.getQuantity() != null && c.getPricePerKg() != null)
                    .map(c -> c.getQuantity().multiply(c.getPricePerKg()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            report.add(new FarmerReportItem(
                    f.getId(),
                    f.getUserId(),
                    f.getName(),
                    f.getPhone(),
                    f.getAddress(),
                    f.getFarmLocation(),
                    totalCrops,
                    estimatedValue
            ));
        }

        reportRecordRepository.save(new ReportRecord("FARMERS_REPORT", "JSON", "admin", report.size()));
        return report;
    }

    @Override
    public byte[] exportFarmersReportCsv() {
        List<FarmerReportItem> items = getFarmersReport();
        StringBuilder sb = new StringBuilder();
        sb.append("Farmer ID,User ID,Name,Phone,Address,Farm Location,Total Crops Listed,Estimated Crop Value\n");
        for (FarmerReportItem i : items) {
            sb.append(escapeCsv(String.valueOf(i.farmerId()))).append(",")
              .append(escapeCsv(String.valueOf(i.userId()))).append(",")
              .append(escapeCsv(i.name())).append(",")
              .append(escapeCsv(i.phone())).append(",")
              .append(escapeCsv(i.address())).append(",")
              .append(escapeCsv(i.farmLocation())).append(",")
              .append(i.totalCropsListed()).append(",")
              .append(i.estimatedCropValue()).append("\n");
        }
        reportRecordRepository.save(new ReportRecord("FARMERS_REPORT", "CSV", "admin", items.size()));
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public List<DealerReportItem> getDealersReport() {
        List<DealerClientDto> dealers = safeFetch(userServiceClient::getAllDealers, Collections.emptyList());
        List<OrderClientDto> orders = safeFetch(orderServiceClient::getAllOrders, Collections.emptyList());

        Map<Long, List<OrderClientDto>> ordersByDealer = new HashMap<>();
        for (OrderClientDto o : orders) {
            if (o.getDealerId() != null) {
                ordersByDealer.computeIfAbsent(o.getDealerId(), k -> new ArrayList<>()).add(o);
            }
        }

        List<DealerReportItem> report = new ArrayList<>();
        for (DealerClientDto d : dealers) {
            List<OrderClientDto> dealerOrders = ordersByDealer.getOrDefault(d.getUserId(), Collections.emptyList());
            long totalOrders = dealerOrders.size();
            BigDecimal totalSpent = dealerOrders.stream()
                    .filter(o -> o.getTotalAmount() != null && !"CANCELLED".equalsIgnoreCase(o.getStatus()))
                    .map(OrderClientDto::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            report.add(new DealerReportItem(
                    d.getId(),
                    d.getUserId(),
                    d.getName(),
                    d.getPhone(),
                    d.getBusinessName(),
                    d.getAddress(),
                    totalOrders,
                    totalSpent
            ));
        }

        reportRecordRepository.save(new ReportRecord("DEALERS_REPORT", "JSON", "admin", report.size()));
        return report;
    }

    @Override
    public byte[] exportDealersReportCsv() {
        List<DealerReportItem> items = getDealersReport();
        StringBuilder sb = new StringBuilder();
        sb.append("Dealer ID,User ID,Name,Phone,Business Name,Address,Total Orders Placed,Total Amount Spent\n");
        for (DealerReportItem i : items) {
            sb.append(escapeCsv(String.valueOf(i.dealerId()))).append(",")
              .append(escapeCsv(String.valueOf(i.userId()))).append(",")
              .append(escapeCsv(i.name())).append(",")
              .append(escapeCsv(i.phone())).append(",")
              .append(escapeCsv(i.businessName())).append(",")
              .append(escapeCsv(i.address())).append(",")
              .append(i.totalOrdersPlaced()).append(",")
              .append(i.totalAmountSpent()).append("\n");
        }
        reportRecordRepository.save(new ReportRecord("DEALERS_REPORT", "CSV", "admin", items.size()));
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public List<CropReportItem> getCropsReport() {
        List<CropClientDto> crops = safeFetch(cropServiceClient::searchCrops, Collections.emptyList());
        List<CropReportItem> report = crops.stream()
                .map(c -> new CropReportItem(
                        c.getId(),
                        c.getFarmerId(),
                        c.getCommodity(),
                        c.getState(),
                        c.getDistrict(),
                        c.getGrade(),
                        c.getQuantity(),
                        c.getUnit(),
                        c.getPricePerKg(),
                        c.getStatus()
                )).toList();

        reportRecordRepository.save(new ReportRecord("CROPS_REPORT", "JSON", "admin", report.size()));
        return report;
    }

    @Override
    public byte[] exportCropsReportCsv() {
        List<CropReportItem> items = getCropsReport();
        StringBuilder sb = new StringBuilder();
        sb.append("Crop ID,Farmer ID,Commodity,State,District,Grade,Quantity,Unit,Price Per Kg,Status\n");
        for (CropReportItem i : items) {
            sb.append(escapeCsv(String.valueOf(i.cropId()))).append(",")
              .append(escapeCsv(String.valueOf(i.farmerId()))).append(",")
              .append(escapeCsv(i.commodity())).append(",")
              .append(escapeCsv(i.state())).append(",")
              .append(escapeCsv(i.district())).append(",")
              .append(escapeCsv(i.grade())).append(",")
              .append(i.quantity()).append(",")
              .append(escapeCsv(i.unit())).append(",")
              .append(i.pricePerKg()).append(",")
              .append(escapeCsv(i.status())).append("\n");
        }
        reportRecordRepository.save(new ReportRecord("CROPS_REPORT", "CSV", "admin", items.size()));
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public List<OrderReportItem> getOrdersReport() {
        List<OrderClientDto> orders = safeFetch(orderServiceClient::getAllOrders, Collections.emptyList());
        List<OrderReportItem> report = orders.stream()
                .map(o -> new OrderReportItem(
                        o.getId(),
                        o.getDealerId(),
                        o.getFarmerId(),
                        o.getCropId(),
                        o.getCropName(),
                        o.getQuantity(),
                        o.getUnitPrice(),
                        o.getTotalAmount(),
                        o.getStatus(),
                        o.getCreatedAt()
                )).toList();

        reportRecordRepository.save(new ReportRecord("ORDERS_REPORT", "JSON", "admin", report.size()));
        return report;
    }

    @Override
    public byte[] exportOrdersReportCsv() {
        List<OrderReportItem> items = getOrdersReport();
        StringBuilder sb = new StringBuilder();
        sb.append("Order ID,Dealer ID,Farmer ID,Crop ID,Crop Name,Quantity,Unit Price,Total Amount,Status,Created At\n");
        for (OrderReportItem i : items) {
            sb.append(escapeCsv(String.valueOf(i.orderId()))).append(",")
              .append(escapeCsv(String.valueOf(i.dealerId()))).append(",")
              .append(escapeCsv(String.valueOf(i.farmerId()))).append(",")
              .append(escapeCsv(String.valueOf(i.cropId()))).append(",")
              .append(escapeCsv(i.cropName())).append(",")
              .append(i.quantity()).append(",")
              .append(i.unitPrice()).append(",")
              .append(i.totalAmount()).append(",")
              .append(escapeCsv(i.status())).append(",")
              .append(escapeCsv(String.valueOf(i.createdAt()))).append("\n");
        }
        reportRecordRepository.save(new ReportRecord("ORDERS_REPORT", "CSV", "admin", items.size()));
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public List<PaymentReportItem> getPaymentsReport() {
        List<PaymentClientDto> payments = safeFetch(paymentServiceClient::getAllPayments, Collections.emptyList());
        List<PaymentReportItem> report = payments.stream()
                .map(p -> new PaymentReportItem(
                        p.getId(),
                        p.getOrderId(),
                        p.getDealerId(),
                        p.getFarmerId(),
                        p.getAmount(),
                        p.getPaymentMethod(),
                        p.getStatus(),
                        p.getTransactionReference(),
                        p.getPaidAt()
                )).toList();

        reportRecordRepository.save(new ReportRecord("PAYMENTS_REPORT", "JSON", "admin", report.size()));
        return report;
    }

    @Override
    public byte[] exportPaymentsReportCsv() {
        List<PaymentReportItem> items = getPaymentsReport();
        StringBuilder sb = new StringBuilder();
        sb.append("Payment ID,Order ID,Dealer ID,Farmer ID,Amount,Payment Method,Status,Transaction Ref,Paid At\n");
        for (PaymentReportItem i : items) {
            sb.append(escapeCsv(String.valueOf(i.paymentId()))).append(",")
              .append(escapeCsv(String.valueOf(i.orderId()))).append(",")
              .append(escapeCsv(String.valueOf(i.dealerId()))).append(",")
              .append(escapeCsv(String.valueOf(i.farmerId()))).append(",")
              .append(i.amount()).append(",")
              .append(escapeCsv(i.paymentMethod())).append(",")
              .append(escapeCsv(i.status())).append(",")
              .append(escapeCsv(i.transactionReference())).append(",")
              .append(escapeCsv(String.valueOf(i.paidAt()))).append("\n");
        }
        reportRecordRepository.save(new ReportRecord("PAYMENTS_REPORT", "CSV", "admin", items.size()));
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private <T> T safeFetch(java.util.function.Supplier<T> supplier, T fallback) {
        try {
            return supplier.get();
        } catch (Exception e) {
            log.warn("ReportService safeFetch failed: {}", e.getMessage());
            return fallback;
        }
    }
}
