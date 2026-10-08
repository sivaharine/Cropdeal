package com.cropdeal.bidding.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.math.BigDecimal;

@FeignClient(name = "order-service")
public interface OrderClient {

    record CreateOrderRequest(
        Long farmerId,
        Long dealerId,
        Long cropId,
        String cropName,
        Integer quantity,
        BigDecimal unitPrice
    ) {}

    @PostMapping("/api/orders")
    Object createOrder(@RequestBody CreateOrderRequest request);
}