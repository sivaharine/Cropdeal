package com.controller;

import com.dto.CreateOrderRequest;
import com.dto.OrderResponse;
import com.dto.PayOrderRequest;
import com.dto.SagaOrderRequest;
import com.saga.OrderSagaService;
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
    private final OrderSagaService orderSagaService;

    public OrderController(
            OrderService orderService,
            OrderSagaService orderSagaService) {
        this.orderService = orderService;
        this.orderSagaService = orderSagaService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(orderService.createOrder(request));
    }

    @PostMapping("/saga")
    public ResponseEntity<OrderResponse> createOrderWithSaga(
            @Valid @RequestBody SagaOrderRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(orderSagaService.startOrderSaga(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                orderService.getOrderById(id));
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders() {

        return ResponseEntity.ok(
                orderService.getAllOrders());
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

    @PutMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        return ResponseEntity.ok(
                orderService.updateOrderStatus(id, status));
    }

    @PutMapping("/{id}/pay")
    public ResponseEntity<OrderResponse> payOrder(
            @PathVariable Long id,
            @Valid @RequestBody PayOrderRequest request) {

        return ResponseEntity.ok(
                orderService.payOrder(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<OrderResponse> cancelOrder(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                orderService.cancelOrder(id));
    }
}
