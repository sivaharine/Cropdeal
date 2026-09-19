package com.service;

import com.dto.CreateOrderRequest;
import com.dto.OrderResponse;
import com.dto.PayOrderRequest;

import java.util.List;

public interface OrderService {

    OrderResponse createOrder(CreateOrderRequest request);

    OrderResponse getOrderById(Long id);

    List<OrderResponse> getAllOrders();

    List<OrderResponse> getOrdersByDealer(Long dealerId);

    List<OrderResponse> getOrdersByFarmer(Long farmerId);

    OrderResponse updateOrderStatus(Long id, String status);

    OrderResponse payOrder(Long id, PayOrderRequest request);

    OrderResponse cancelOrder(Long id);
}