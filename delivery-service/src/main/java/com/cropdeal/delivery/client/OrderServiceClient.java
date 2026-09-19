package com.cropdeal.delivery.client;

import com.cropdeal.delivery.dto.OrderLookupResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "order-service")
public interface OrderServiceClient {

    @GetMapping("/api/orders/{id}")
    OrderLookupResponse getOrderById(@PathVariable Long id);
}
