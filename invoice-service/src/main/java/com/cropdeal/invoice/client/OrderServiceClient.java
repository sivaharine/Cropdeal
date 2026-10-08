package com.cropdeal.invoice.client;

import com.cropdeal.invoice.dto.client.OrderDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "order-service")
public interface OrderServiceClient {

    @GetMapping("/api/orders/{id}")
    OrderDto getOrderById(@PathVariable("id") Long id);
}
