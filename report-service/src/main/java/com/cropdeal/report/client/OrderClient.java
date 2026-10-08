package com.cropdeal.report.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.Map;

@FeignClient(name = "order-service", url = "${order-service.url:http://localhost:8088}")
public interface OrderClient {

    @GetMapping("/api/orders")
    List<Map<String, Object>> getAllOrders();
}
