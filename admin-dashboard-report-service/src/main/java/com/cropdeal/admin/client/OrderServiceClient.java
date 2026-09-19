package com.cropdeal.admin.client;

import com.cropdeal.admin.dto.client.OrderClientDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@FeignClient(name = "order-service")
public interface OrderServiceClient {

    @GetMapping("/api/orders")
    List<OrderClientDto> getAllOrders();

    @GetMapping("/api/orders/{id}")
    OrderClientDto getOrderById(@PathVariable("id") Long id);

    @PutMapping("/api/orders/{id}/status")
    OrderClientDto updateOrderStatus(@PathVariable("id") Long id, @RequestParam("status") String status);

    @DeleteMapping("/api/orders/{id}")
    void deleteOrder(@PathVariable("id") Long id);
}
