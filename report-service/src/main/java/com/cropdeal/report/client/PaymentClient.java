package com.cropdeal.report.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.Map;

@FeignClient(name = "payment-service", url = "${payment-service.url:http://localhost:8089}")
public interface PaymentClient {

    @GetMapping("/api/payments")
    List<Map<String, Object>> getAllPayments();
}
