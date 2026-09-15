package com.service;

import com.dto.CreateOrderRequest;
import com.dto.OrderResponse;
import com.dto.PayOrderRequest;
import com.dto.PaymentResponse;
import com.dto.UpdateOrderRequest;
import com.dto.UpdateOrderStatusRequest;

import java.util.List;

public interface OrderService {

    OrderResponse createOrder(CreateOrderRequest request);

    List<OrderResponse> getAllOrders();

    OrderResponse getOrderById(Long id);

    List<OrderResponse> getOrdersByDealer(Long dealerId);

    List<OrderResponse> getOrdersByFarmer(Long farmerId);

    PaymentResponse payOrder(Long orderId, PayOrderRequest request);

    OrderResponse updateOrder(Long id, UpdateOrderRequest request);

    void deleteOrder(Long id);

    OrderResponse updateOrderStatus(Long id, UpdateOrderStatusRequest request);

    OrderResponse requestReturn(Long id);

    OrderResponse cancelReturn(Long id);
}