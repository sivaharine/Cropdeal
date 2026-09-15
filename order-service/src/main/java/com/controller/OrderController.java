package com.controller;

import com.dto.CreateOrderRequest;
import com.dto.OrderResponse;
import com.dto.PayOrderRequest;
import com.dto.PaymentResponse;
import com.dto.UpdateOrderRequest;
import com.dto.UpdateOrderStatusRequest;
import com.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(orderService.createOrder(request));
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders() {

        return ResponseEntity.ok(
                orderService.getAllOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                orderService.getOrderById(id));
    }

    @GetMapping("/dealer/{dealerId}")
    public ResponseEntity<List<OrderResponse>> getOrdersByDealer(
            @PathVariable Long dealerId) {

        return ResponseEntity.ok(
                orderService.getOrdersByDealer(dealerId));
    }

    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<List<OrderResponse>> getOrdersByFarmer(
            @PathVariable Long farmerId) {

        return ResponseEntity.ok(
                orderService.getOrdersByFarmer(farmerId));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<PaymentResponse> payOrder(
            @PathVariable Long id,
            @Valid @RequestBody PayOrderRequest request) {

        return ResponseEntity.ok(
                orderService.payOrder(id, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderResponse> updateOrder(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderRequest request) {

        return ResponseEntity.ok(
                orderService.updateOrder(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteOrder(
            @PathVariable Long id) {

        orderService.deleteOrder(id);

        return ResponseEntity.ok(
                "Order deleted successfully");
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {

        return ResponseEntity.ok(
                orderService.updateOrderStatus(id, request));
    }

    @PutMapping("/{id}/return")
    public ResponseEntity<OrderResponse> requestReturn(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                orderService.requestReturn(id));
    }

    @DeleteMapping("/{id}/return")
    public ResponseEntity<OrderResponse> cancelReturn(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                orderService.cancelReturn(id));
    }
}