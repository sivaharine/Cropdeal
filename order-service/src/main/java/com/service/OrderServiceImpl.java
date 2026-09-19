package com.service;

import com.client.PaymentServiceClient;
import com.dto.CreateOrderRequest;
import com.dto.OrderResponse;
import com.dto.PayOrderRequest;
import com.dto.PaymentRequest;
import com.dto.PaymentResponse;
import com.entity.Order;
import com.entity.OrderStatus;
import com.exception.OrderNotFoundException;
import com.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final PaymentServiceClient paymentServiceClient;

    public OrderServiceImpl(
            OrderRepository orderRepository,
            PaymentServiceClient paymentServiceClient) {

        this.orderRepository = orderRepository;
        this.paymentServiceClient = paymentServiceClient;
    }

    @Override
    public OrderResponse createOrder(CreateOrderRequest request) {

        BigDecimal totalAmount =
                request.getUnitPrice().multiply(
                        BigDecimal.valueOf(request.getQuantity()));

        Order order = new Order();
        order.setFarmerId(request.getFarmerId());
        order.setDealerId(request.getDealerId());
        order.setCropId(request.getCropId());
        order.setCropName(request.getCropName());
        order.setQuantity(request.getQuantity());
        order.setUnitPrice(request.getUnitPrice());
        order.setTotalAmount(totalAmount);
        order.setStatus(OrderStatus.CREATED);

        Order savedOrder = orderRepository.save(order);

        return mapToResponse(savedOrder);
    }

    @Override
    public OrderResponse getOrderById(Long id) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() ->
                        new OrderNotFoundException(
                                "Order not found with id: " + id));

        return mapToResponse(order);
    }

    @Override
    public List<OrderResponse> getAllOrders() {

        return orderRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderResponse> getOrdersByDealer(Long dealerId) {

        return orderRepository.findByDealerId(dealerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderResponse> getOrdersByFarmer(Long farmerId) {

        return orderRepository.findByFarmerId(farmerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public OrderResponse updateOrderStatus(Long id, String status) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() ->
                        new OrderNotFoundException(
                                "Order not found with id: " + id));

        try {
            OrderStatus newStatus =
                    OrderStatus.valueOf(status.toUpperCase());
            order.setStatus(newStatus);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid order status: " + status);
        }

        Order updatedOrder = orderRepository.save(order);

        return mapToResponse(updatedOrder);
    }

    @Override
    public OrderResponse payOrder(Long id, PayOrderRequest request) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() ->
                        new OrderNotFoundException(
                                "Order not found with id: " + id));

        if (order.getStatus() == OrderStatus.PAID
                || order.getStatus() == OrderStatus.CONFIRMED) {
            throw new IllegalStateException(
                    "Order is already paid");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException(
                    "Cannot pay for a cancelled order");
        }

        PaymentRequest paymentRequest = new PaymentRequest();
        paymentRequest.setOrderId(order.getId());
        paymentRequest.setDealerId(order.getDealerId());
        paymentRequest.setFarmerId(order.getFarmerId());
        paymentRequest.setAmount(order.getTotalAmount());
        paymentRequest.setPaymentMethod(request.getPaymentMethod());

        PaymentResponse paymentResponse =
                paymentServiceClient.makePayment(paymentRequest);

        if (paymentResponse != null
                && "SUCCESS".equalsIgnoreCase(paymentResponse.getStatus())) {

            order.setStatus(OrderStatus.PAID);
        } else {
            order.setStatus(OrderStatus.PAYMENT_PENDING);
        }

        Order updatedOrder = orderRepository.save(order);

        return mapToResponse(updatedOrder);
    }

    @Override
    public OrderResponse cancelOrder(Long id) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() ->
                        new OrderNotFoundException(
                                "Order not found with id: " + id));

        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalStateException(
                    "Delivered order cannot be cancelled");
        }

        order.setStatus(OrderStatus.CANCELLED);

        Order updatedOrder = orderRepository.save(order);

        return mapToResponse(updatedOrder);
    }

    private OrderResponse mapToResponse(Order order) {

        OrderResponse response = new OrderResponse();

        response.setId(order.getId());
        response.setFarmerId(order.getFarmerId());
        response.setDealerId(order.getDealerId());
        response.setCropId(order.getCropId());
        response.setCropName(order.getCropName());
        response.setQuantity(order.getQuantity());
        response.setUnitPrice(order.getUnitPrice());
        response.setTotalAmount(order.getTotalAmount());
        response.setStatus(order.getStatus().name());
        response.setCreatedAt(order.getCreatedAt());
        response.setUpdatedAt(order.getUpdatedAt());

        return response;
    }
}