package com.cropdeal.report.service;

import com.cropdeal.report.client.CropClient;
import com.cropdeal.report.client.OrderClient;
import com.cropdeal.report.client.PaymentClient;
import com.cropdeal.report.client.UserClient;
import com.cropdeal.report.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportServiceImpl implements ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportServiceImpl.class);

    private final UserClient userClient;
    private final PaymentClient paymentClient;
    private final OrderClient orderClient;
    private final CropClient cropClient;

    public ReportServiceImpl(
            UserClient userClient,
            PaymentClient paymentClient,
            OrderClient orderClient,
            CropClient cropClient
    ) {
        this.userClient = userClient;
        this.paymentClient = paymentClient;
        this.orderClient = orderClient;
        this.cropClient = cropClient;
    }

    @Override
    public PaymentReportResponse getPaymentReport() {
        List<Map<String, Object>> payments = safeFetchList(paymentClient::getAllPayments, "payments");

        long totalTransactions = payments.size();
        double totalRevenue = 0.0;
        long successful = 0;
        long failed = 0;
        Map<String, Long> methodCounts = new HashMap<>();

        for (Map<String, Object> p : payments) {
            String status = String.valueOf(p.getOrDefault("status", "")).toUpperCase();
            String method = String.valueOf(p.getOrDefault("paymentMethod", "UNKNOWN")).toUpperCase();
            double amt = parseDouble(p.get("amount"));

            methodCounts.put(method, methodCounts.getOrDefault(method, 0L) + 1L);

            if (status.contains("SUCCESS") || status.contains("COMPLETED") || status.contains("PAID")) {
                successful++;
                totalRevenue += amt;
            } else if (status.contains("FAIL") || status.contains("CANCEL")) {
                failed++;
            }
        }

        double deliveryFees = successful * 100.0; // Fixed static 100 INR delivery fee

        return new PaymentReportResponse(
                totalTransactions,
                Math.round(totalRevenue * 100.0) / 100.0,
                successful,
                failed,
                deliveryFees,
                methodCounts
        );
    }

    @Override
    public DealerReportResponse getDealerReport() {
        List<Map<String, Object>> dealers = safeFetchList(userClient::getAllDealers, "dealers");
        List<Map<String, Object>> orders = safeFetchList(orderClient::getAllOrders, "orders");

        long totalDealers = dealers.size();
        long totalOrders = orders.size();
        double totalSpent = 0.0;
        Set<Object> activeDealerIds = new HashSet<>();
        Map<String, Double> dealerSpending = new HashMap<>();
        Map<String, Long> dealerOrderCounts = new HashMap<>();

        for (Map<String, Object> o : orders) {
            Object dealerIdObj = o.get("dealerId");
            if (dealerIdObj != null) {
                activeDealerIds.add(dealerIdObj);
                String dKey = "Dealer #" + dealerIdObj;
                double amt = parseDouble(o.get("totalAmount"));
                totalSpent += amt;
                dealerSpending.put(dKey, dealerSpending.getOrDefault(dKey, 0.0) + amt);
                dealerOrderCounts.put(dKey, dealerOrderCounts.getOrDefault(dKey, 0L) + 1L);
            }
        }

        double avgSpend = totalDealers > 0 ? Math.round((totalSpent / totalDealers) * 100.0) / 100.0 : 0.0;

        List<Map<String, Object>> topDealers = dealerSpending.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("dealer", e.getKey());
                    map.put("totalSpent", Math.round(e.getValue() * 100.0) / 100.0);
                    map.put("ordersPlaced", dealerOrderCounts.getOrDefault(e.getKey(), 0L));
                    return map;
                })
                .collect(Collectors.toList());

        return new DealerReportResponse(
                totalDealers,
                activeDealerIds.size(),
                totalOrders,
                Math.round(totalSpent * 100.0) / 100.0,
                avgSpend,
                topDealers
        );
    }

    @Override
    public FarmerReportResponse getFarmerReport() {
        List<Map<String, Object>> farmers = safeFetchList(userClient::getAllFarmers, "farmers");
        List<Map<String, Object>> reviews = safeFetchList(userClient::getAllReviews, "reviews");

        long totalFarmers = farmers.size();
        long blockedFarmers = 0;
        double sumRating = 0.0;
        int ratedCount = 0;

        List<Map<String, Object>> topFarmers = new ArrayList<>();

        for (Map<String, Object> f : farmers) {
            Boolean blocked = (Boolean) f.get("isBlocked");
            if (Boolean.TRUE.equals(blocked)) {
                blockedFarmers++;
            }
            double rating = parseDouble(f.get("averageRating"));
            if (rating > 0.0) {
                sumRating += rating;
                ratedCount++;
            }

            Map<String, Object> fInfo = new HashMap<>();
            fInfo.put("farmerId", f.get("id"));
            fInfo.put("name", f.get("name"));
            fInfo.put("rating", rating);
            fInfo.put("farmLocation", f.get("farmLocation"));
            fInfo.put("isBlocked", Boolean.TRUE.equals(blocked));
            topFarmers.add(fInfo);
        }

        topFarmers.sort((a, b) -> Double.compare(parseDouble(b.get("rating")), parseDouble(a.get("rating"))));
        List<Map<String, Object>> top5 = topFarmers.stream().limit(5).collect(Collectors.toList());

        double avgRating = ratedCount > 0 ? Math.round((sumRating / ratedCount) * 10.0) / 10.0 : 0.0;
        long activeFarmers = totalFarmers - blockedFarmers;

        return new FarmerReportResponse(
                totalFarmers,
                activeFarmers,
                blockedFarmers,
                totalFarmers,
                avgRating,
                reviews.size(),
                top5
        );
    }

    @Override
    public DeliveryPartnerReportResponse getDeliveryPartnerReport() {
        List<Map<String, Object>> partners = safeFetchList(userClient::getAllDeliveryPartners, "deliveryPartners");

        long totalPartners = partners.size();
        long available = 0;
        long busy = 0;
        long offline = 0;
        Map<String, Long> vehicles = new HashMap<>();

        for (Map<String, Object> dp : partners) {
            String status = String.valueOf(dp.getOrDefault("availabilityStatus", "AVAILABLE")).toUpperCase();
            String vType = String.valueOf(dp.getOrDefault("vehicleType", "UNKNOWN")).toUpperCase();

            vehicles.put(vType, vehicles.getOrDefault(vType, 0L) + 1L);

            if (status.contains("AVAILABLE")) available++;
            else if (status.contains("BUSY") || status.contains("DELIVERING")) busy++;
            else offline++;
        }

        // Static estimate of completed deliveries based on activity
        long completedDeliveries = available + busy;
        double earnings = completedDeliveries * 100.0; // 100 INR static partner fee

        return new DeliveryPartnerReportResponse(
                totalPartners,
                available,
                busy,
                offline,
                completedDeliveries,
                earnings,
                vehicles
        );
    }

    @Override
    public CropReportResponse getCropReport() {
        List<Map<String, Object>> crops = safeFetchList(cropClient::searchCrops, "crops");

        long totalCrops = crops.size();
        long activeCount = 0;
        double totalQuantity = 0.0;
        double sumPrice = 0.0;
        Map<String, Long> categoryCounts = new HashMap<>();
        Map<String, Double> volumeByCommodity = new HashMap<>();

        for (Map<String, Object> c : crops) {
            String status = String.valueOf(c.getOrDefault("status", "AVAILABLE")).toUpperCase();
            String commodity = String.valueOf(c.getOrDefault("commodity", "GENERAL")).toUpperCase();
            double qty = parseDouble(c.get("quantity"));
            double price = parseDouble(c.get("pricePerKg"));

            categoryCounts.put(commodity, categoryCounts.getOrDefault(commodity, 0L) + 1L);
            volumeByCommodity.put(commodity, volumeByCommodity.getOrDefault(commodity, 0.0) + qty);

            totalQuantity += qty;
            sumPrice += price;

            if (status.contains("AVAILABLE") || status.contains("ACTIVE")) {
                activeCount++;
            }
        }

        double avgPrice = totalCrops > 0 ? Math.round((sumPrice / totalCrops) * 100.0) / 100.0 : 0.0;

        List<Map<String, Object>> topCrops = volumeByCommodity.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("commodity", e.getKey());
                    map.put("totalQuantityKg", Math.round(e.getValue() * 100.0) / 100.0);
                    return map;
                })
                .collect(Collectors.toList());

        return new CropReportResponse(
                totalCrops,
                activeCount,
                Math.round(totalQuantity * 100.0) / 100.0,
                avgPrice,
                categoryCounts,
                topCrops
        );
    }

    @Override
    public ExecutiveDashboardReport getExecutiveDashboard() {
        return new ExecutiveDashboardReport(
                getPaymentReport(),
                getDealerReport(),
                getFarmerReport(),
                getDeliveryPartnerReport(),
                getCropReport(),
                Instant.now().toString()
        );
    }

    private <T> List<T> safeFetchList(java.util.function.Supplier<List<T>> supplier, String resourceName) {
        try {
            List<T> list = supplier.get();
            return (list != null) ? list : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Unable to fetch {} from remote service: {}", resourceName, e.getMessage());
            return Collections.emptyList();
        }
    }

    private double parseDouble(Object val) {
        if (val == null) return 0.0;
        if (val instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(val.toString());
        } catch (Exception e) {
            return 0.0;
        }
    }
}
