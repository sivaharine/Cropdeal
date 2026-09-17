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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentServiceClient paymentServiceClient;

    @InjectMocks
    private OrderServiceImpl orderService;

    private Order order;

    @BeforeEach
    void setUp() {
        order = new Order();
        order.setId(1L);
        order.setFarmerId(101L);
        order.setDealerId(201L);
        order.setCropId(301L);
        order.setCropName("Wheat");
        order.setQuantity(10);
        order.setUnitPrice(new BigDecimal("250.00"));
        order.setTotalAmount(new BigDecimal("2500.00"));
        order.setStatus(OrderStatus.CREATED);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void testCreateOrder() {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setFarmerId(101L);
        request.setDealerId(201L);
        request.setCropId(301L);
        request.setCropName("Wheat");
        request.setQuantity(10);
        request.setUnitPrice(new BigDecimal("250.00"));

        when(orderRepository.save(any(Order.class))).thenReturn(order);

        OrderResponse response = orderService.createOrder(request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("CREATED", response.getStatus());
        assertEquals(new BigDecimal("2500.00"), response.getTotalAmount());
        verify(orderRepository, times(1)).save(any(Order.class));
    }

    @Test
    void testGetOrderById() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        OrderResponse response = orderService.getOrderById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Wheat", response.getCropName());
        verify(orderRepository, times(1)).findById(1L);
    }

    @Test
    void testGetOrderByIdNotFound() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(OrderNotFoundException.class,
                () -> orderService.getOrderById(999L));
        verify(orderRepository, times(1)).findById(999L);
    }

    @Test
    void testGetAllOrders() {
        when(orderRepository.findAll()).thenReturn(List.of(order));

        List<OrderResponse> responses = orderService.getAllOrders();

        assertNotNull(responses);
        assertEquals(1, responses.size());
        verify(orderRepository, times(1)).findAll();
    }

    @Test
    void testGetOrdersByDealer() {
        when(orderRepository.findByDealerId(201L)).thenReturn(List.of(order));

        List<OrderResponse> responses = orderService.getOrdersByDealer(201L);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        verify(orderRepository, times(1)).findByDealerId(201L);
    }

    @Test
    void testGetOrdersByFarmer() {
        when(orderRepository.findByFarmerId(101L)).thenReturn(List.of(order));

        List<OrderResponse> responses = orderService.getOrdersByFarmer(101L);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        verify(orderRepository, times(1)).findByFarmerId(101L);
    }

    @Test
    void testUpdateOrderStatus() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        OrderResponse response = orderService.updateOrderStatus(1L, "CONFIRMED");

        assertNotNull(response);
        verify(orderRepository, times(1)).findById(1L);
        verify(orderRepository, times(1)).save(order);
    }

    @Test
    void testPayOrderSuccessful() {
        PayOrderRequest request = new PayOrderRequest();
        request.setPaymentMethod("UPI");

        PaymentResponse paymentResponse = new PaymentResponse();
        paymentResponse.setStatus("SUCCESS");

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentServiceClient.makePayment(any(PaymentRequest.class))).thenReturn(paymentResponse);
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        OrderResponse response = orderService.payOrder(1L, request);

        assertNotNull(response);
        verify(paymentServiceClient, times(1)).makePayment(any(PaymentRequest.class));
        verify(orderRepository, times(1)).save(order);
    }

    @Test
    void testCancelOrder() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        OrderResponse response = orderService.cancelOrder(1L);

        assertNotNull(response);
        verify(orderRepository, times(1)).findById(1L);
        verify(orderRepository, times(1)).save(order);
    }
}