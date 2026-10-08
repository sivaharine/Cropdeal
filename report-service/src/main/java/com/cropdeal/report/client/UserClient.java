package com.cropdeal.report.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.Map;

@FeignClient(name = "user-service", url = "${user-service.url:http://localhost:8082}")
public interface UserClient {

    @GetMapping("/api/admin/farmers")
    List<Map<String, Object>> getAllFarmers();

    @GetMapping("/api/admin/dealers")
    List<Map<String, Object>> getAllDealers();

    @GetMapping("/api/admin/delivery-partners")
    List<Map<String, Object>> getAllDeliveryPartners();

    @GetMapping("/api/admin/reviews")
    List<Map<String, Object>> getAllReviews();
}
