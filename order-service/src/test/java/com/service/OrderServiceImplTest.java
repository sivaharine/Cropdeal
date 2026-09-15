package com.service;

import com.client.PaymentServiceClient;
import com.dto.CreateOrderRequest;
import com.dto.OrderResponse;
import com.dto.PayOrderRequest;
import com.dto.PaymentRequest;
import com.dto.PaymentResponse;
import com.dto.UpdateOrderRequest;
import com.dto.UpdateOrderStatusRequest;
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
import java.util.Arrays;
import java.util.Collections;
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
        order.setCropName("Rice");
        order.setQuantity(10);
        order.setUnitPrice(new BigDecimal("250.00"));
        order.setTotalAmount(new BigDecimal("2500.00"));
        order.setStatus(OrderStatus.CREATED);
    }

    // =========================================================
    // CREATE ORDER
    // =========================================================

    @Test
    void testCreateOrder() {

        CreateOrderRequest request =
                new CreateOrderRequest();

        request.setFarmerId(101L);
        request.setDealerId(201L);
        request.setCropId(301L);
        request.setCropName("Rice");
        request.setQuantity(10);
        request.setUnitPrice(
                new BigDecimal("250.00"));

        when(orderRepository.save(any(Order.class)))
                .thenReturn(order);

        OrderResponse response =
                orderService.createOrder(request);

        assertNotNull(response);

        assertEquals(1L, response.getId());
        assertEquals(101L, response.getFarmerId());
        assertEquals(201L, response.getDealerId());
        assertEquals(301L, response.getCropId());
        assertEquals("Rice", response.getCropName());
        assertEquals(10, response.getQuantity());
        assertEquals(
                new BigDecimal("250.00"),
                response.getUnitPrice());

        assertEquals(
                new BigDecimal("2500.00"),
                response.getTotalAmount());

        verify(orderRepository, times(1))
                .save(any(Order.class));
    }

    // =========================================================
    // GET ALL ORDERS
    // =========================================================

    @Test
    void testGetAllOrders() {

        Order order2 = new Order();

        order2.setId(2L);
        order2.setFarmerId(102L);
        order2.setDealerId(202L);
        order2.setCropId(302L);
        order2.setCropName("Wheat");
        order2.setQuantity(5);
        order2.setUnitPrice(
                new BigDecimal("300.00"));
        order2.setTotalAmount(
                new BigDecimal("1500.00"));
        order2.setStatus(OrderStatus.CREATED);

        when(orderRepository.findAll())
                .thenReturn(Arrays.asList(order, order2));

        List<OrderResponse> responses =
                orderService.getAllOrders();

        assertNotNull(responses);

        assertEquals(2, responses.size());

        assertEquals(
                1L,
                responses.get(0).getId());

        assertEquals(
                2L,
                responses.get(1).getId());

        verify(orderRepository, times(1))
                .findAll();
    }

    // =========================================================
    // GET ALL ORDERS - EMPTY
    // =========================================================

    @Test
    void testGetAllOrdersWhenEmpty() {

        when(orderRepository.findAll())
                .thenReturn(Collections.emptyList());

        List<OrderResponse> responses =
                orderService.getAllOrders();

        assertNotNull(responses);

        assertTrue(responses.isEmpty());

        verify(orderRepository, times(1))
                .findAll();
    }

    // =========================================================
    // GET ORDER BY ID
    // =========================================================

    @Test
    void testGetOrderById() {

        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(order));

        OrderResponse response =
                orderService.getOrderById(1L);

        assertNotNull(response);

        assertEquals(1L, response.getId());
        assertEquals(101L, response.getFarmerId());
        assertEquals(201L, response.getDealerId());
        assertEquals("Rice", response.getCropName());
        assertEquals("CREATED", response.getStatus());

        verify(orderRepository, times(1))
                .findById(1L);
    }

    // =========================================================
    // GET ORDER BY ID - NOT FOUND
    // =========================================================

    @Test
    void testGetOrderByIdNotFound() {

        when(orderRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                OrderNotFoundException.class,
                () -> orderService.getOrderById(999L));

        verify(orderRepository, times(1))
                .findById(999L);
    }

    // =========================================================
    // GET ORDERS BY DEALER
    // =========================================================

    @Test
    void testGetOrdersByDealer() {

        when(orderRepository.findByDealerId(201L))
                .thenReturn(List.of(order));

        List<OrderResponse> responses =
                orderService.getOrdersByDealer(201L);

        assertNotNull(responses);

        assertEquals(1, responses.size());

        assertEquals(
                201L,
                responses.get(0).getDealerId());

        verify(orderRepository, times(1))
                .findByDealerId(201L);
    }

    // =========================================================
    // GET ORDERS BY FARMER
    // =========================================================

    @Test
    void testGetOrdersByFarmer() {

        when(orderRepository.findByFarmerId(101L))
                .thenReturn(List.of(order));

        List<OrderResponse> responses =
                orderService.getOrdersByFarmer(101L);

        assertNotNull(responses);

        assertEquals(1, responses.size());

        assertEquals(
                101L,
                responses.get(0).getFarmerId());

        verify(orderRepository, times(1))
                .findByFarmerId(101L);
    }

    // =========================================================
    // PAY ORDER - SUCCESS
    // =========================================================

    @Test
    void testPayOrderSuccess() {

        PayOrderRequest request =
                new PayOrderRequest();

        request.setPaymentMethod("UPI");

        PaymentResponse paymentResponse =
                new PaymentResponse();

        paymentResponse.setId(501L);
        paymentResponse.setOrderId(1L);
        paymentResponse.setAmount(
                new BigDecimal("2500.00"));
        paymentResponse.setPaymentMethod("UPI");
        paymentResponse.setStatus("SUCCESS");
        paymentResponse.setTransactionReference(
                "TXN-12345678");

        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(order));

        when(orderRepository.save(any(Order.class)))
                .thenReturn(order);

        when(paymentServiceClient.makePayment(
                any(PaymentRequest.class)))
                .thenReturn(paymentResponse);

        PaymentResponse response =
                orderService.payOrder(1L, request);

        assertNotNull(response);

        assertEquals(
                "SUCCESS",
                response.getStatus());

        assertEquals(
                OrderStatus.PAID,
                order.getStatus());

        verify(paymentServiceClient, times(1))
                .makePayment(any(PaymentRequest.class));

        verify(orderRepository, atLeastOnce())
                .save(any(Order.class));
    }

    // =========================================================
    // PAY ORDER - ALREADY PAID
    // =========================================================

    @Test
    void testPayOrderAlreadyPaid() {

        order.setStatus(OrderStatus.PAID);

        PayOrderRequest request =
                new PayOrderRequest();

        request.setPaymentMethod("UPI");

        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(order));

        assertThrows(
                IllegalStateException.class,
                () -> orderService.payOrder(1L, request));

        verify(paymentServiceClient, never())
                .makePayment(any(PaymentRequest.class));
    }

    // =========================================================
    // PAY CANCELLED ORDER
    // =========================================================

    @Test
    void testPayCancelledOrder() {

        order.setStatus(OrderStatus.CANCELLED);

        PayOrderRequest request =
                new PayOrderRequest();

        request.setPaymentMethod("UPI");

        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(order));

        assertThrows(
                IllegalStateException.class,
                () -> orderService.payOrder(1L, request));

        verify(paymentServiceClient, never())
                .makePayment(any(PaymentRequest.class));
    }

    // =========================================================
    // UPDATE ORDER
    // =========================================================

    @Test
    void testUpdateOrder() {

        UpdateOrderRequest request =
                new UpdateOrderRequest();

        request.setCropName("Updated Rice");
        request.setQuantity(20);
        request.setUnitPrice(
                new BigDecimal("300.00"));

        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(order));

        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        OrderResponse response =
                orderService.updateOrder(1L, request);

        assertNotNull(response);

        assertEquals(
                "Updated Rice",
                response.getCropName());

        assertEquals(
                20,
                response.getQuantity());

        assertEquals(
                new BigDecimal("300.00"),
                response.getUnitPrice());

        assertEquals(
                new BigDecimal("6000.00"),
                response.getTotalAmount());

        verify(orderRepository, times(1))
                .findById(1L);

        verify(orderRepository, times(1))
                .save(any(Order.class));
    }

    // =========================================================
    // UPDATE ORDER - PARTIAL UPDATE
    // =========================================================

    @Test
    void testUpdateOrderPartialUpdate() {

        UpdateOrderRequest request =
                new UpdateOrderRequest();

        request.setQuantity(15);

        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(order));

        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        OrderResponse response =
                orderService.updateOrder(1L, request);

        assertEquals(
                15,
                response.getQuantity());

        assertEquals(
                new BigDecimal("3750.00"),
                response.getTotalAmount());

        // Existing values remain unchanged
        assertEquals(
                "Rice",
                response.getCropName());

        assertEquals(
                new BigDecimal("250.00"),
                response.getUnitPrice());
    }

    // =========================================================
    // UPDATE ORDER - NOT FOUND
    // =========================================================

    @Test
    void testUpdateOrderNotFound() {

        UpdateOrderRequest request =
                new UpdateOrderRequest();

        request.setQuantity(20);

        when(orderRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                OrderNotFoundException.class,
                () -> orderService.updateOrder(
                        999L,
                        request));

        verify(orderRepository, never())
                .save(any(Order.class));
    }

    // =========================================================
    // UPDATE PAID ORDER - SHOULD FAIL
    // =========================================================

    @Test
    void testUpdatePaidOrderShouldFail() {

        order.setStatus(OrderStatus.PAID);

        UpdateOrderRequest request =
                new UpdateOrderRequest();

        request.setQuantity(20);

        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(order));

        assertThrows(
                IllegalStateException.class,
                () -> orderService.updateOrder(
                        1L,
                        request));

        verify(orderRepository, never())
                .save(any(Order.class));
    }

    // =========================================================
    // DELETE ORDER
    // =========================================================

    @Test
    void testDeleteOrder() {

        order.setStatus(OrderStatus.CREATED);

        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(order));

        doNothing()
                .when(orderRepository)
                .delete(order);

        assertDoesNotThrow(
                () -> orderService.deleteOrder(1L));

        verify(orderRepository, times(1))
                .findById(1L);

        verify(orderRepository, times(1))
                .delete(order);
    }

    // =========================================================
    // DELETE ORDER - NOT FOUND
    // =========================================================

    @Test
    void testDeleteOrderNotFound() {

        when(orderRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                OrderNotFoundException.class,
                () -> orderService.deleteOrder(999L));

        verify(orderRepository, never())
                .delete(any(Order.class));
    }

    // =========================================================
    // DELETE PAID ORDER - SHOULD FAIL
    // =========================================================

    @Test
    void testDeletePaidOrderShouldFail() {

        order.setStatus(OrderStatus.PAID);

        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(order));

        assertThrows(
                IllegalStateException.class,
                () -> orderService.deleteOrder(1L));

        verify(orderRepository, never())
                .delete(any(Order.class));
    }

    // =========================================================
    // UPDATE ORDER STATUS
    // =========================================================

    @Test
    void testUpdateOrderStatus() {

        UpdateOrderStatusRequest request =
                new UpdateOrderStatusRequest();

        request.setStatus("CONFIRMED");

        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(order));

        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        OrderResponse response =
                orderService.updateOrderStatus(
                        1L,
                        request);

        assertNotNull(response);

        assertEquals(
                "CONFIRMED",
                response.getStatus());

        assertEquals(
                OrderStatus.CONFIRMED,
                order.getStatus());

        verify(orderRepository, times(1))
                .save(any(Order.class));
    }

    // =========================================================
    // UPDATE ORDER STATUS - LOWERCASE INPUT
    // =========================================================

    @Test
    void testUpdateOrderStatusLowercase() {

        UpdateOrderStatusRequest request =
                new UpdateOrderStatusRequest();

        request.setStatus("shipped");

        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(order));

        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        OrderResponse response =
                orderService.updateOrderStatus(
                        1L,
                        request);

        assertEquals(
                "SHIPPED",
                response.getStatus());

        assertEquals(
                OrderStatus.SHIPPED,
                order.getStatus());
    }

    // =========================================================
    // UPDATE ORDER STATUS - INVALID
    // =========================================================

    @Test
    void testUpdateOrderStatusInvalid() {

        UpdateOrderStatusRequest request =
                new UpdateOrderStatusRequest();

        request.setStatus("INVALID_STATUS");

        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(order));

        assertThrows(
                IllegalArgumentException.class,
                () -> orderService.updateOrderStatus(
                        1L,
                        request));

        verify(orderRepository, never())
                .save(any(Order.class));
    }

    // =========================================================
    // RETURN REQUEST - PAID ORDER
    // =========================================================

    @Test
    void testRequestReturnForPaidOrder() {

        order.setStatus(OrderStatus.PAID);

        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(order));

        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        OrderResponse response =
                orderService.requestReturn(1L);

        assertNotNull(response);

        assertEquals(
                "RETURN_REQUESTED",
                response.getStatus());

        assertEquals(
                OrderStatus.RETURN_REQUESTED,
                order.getStatus());

        verify(orderRepository, times(1))
                .save(any(Order.class));
    }

    // =========================================================
    // RETURN REQUEST - DELIVERED ORDER
    // =========================================================

    @Test
    void testRequestReturnForDeliveredOrder() {

        order.setStatus(OrderStatus.DELIVERED);

        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(order));

        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        OrderResponse response =
                orderService.requestReturn(1L);

        assertEquals(
                "RETURN_REQUESTED",
                response.getStatus());

        assertEquals(
                OrderStatus.RETURN_REQUESTED,
                order.getStatus());
    }

    // =========================================================
    // RETURN REQUEST - INVALID STATUS
    // =========================================================

    @Test
    void testRequestReturnInvalidStatus() {

        order.setStatus(OrderStatus.CREATED);

        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(order));

        assertThrows(
                IllegalStateException.class,
                () -> orderService.requestReturn(1L));

        verify(orderRepository, never())
                .save(any(Order.class));
    }

    // =========================================================
    // RETURN REQUEST - NOT FOUND
    // =========================================================

    @Test
    void testRequestReturnNotFound() {

        when(orderRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                OrderNotFoundException.class,
                () -> orderService.requestReturn(999L));

        verify(orderRepository, never())
                .save(any(Order.class));
    }

    // =========================================================
    // CANCEL RETURN
    // =========================================================

    @Test
    void testCancelReturn() {

        order.setStatus(
                OrderStatus.RETURN_REQUESTED);

        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(order));

        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        OrderResponse response =
                orderService.cancelReturn(1L);

        assertNotNull(response);

        assertEquals(
                "PAID",
                response.getStatus());

        assertEquals(
                OrderStatus.PAID,
                order.getStatus());

        verify(orderRepository, times(1))
                .save(any(Order.class));
    }

    // =========================================================
    // CANCEL RETURN - INVALID STATUS
    // =========================================================

    @Test
    void testCancelReturnInvalidStatus() {

        order.setStatus(OrderStatus.PAID);

        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(order));

        assertThrows(
                IllegalStateException.class,
                () -> orderService.cancelReturn(1L));

        verify(orderRepository, never())
                .save(any(Order.class));
    }

    // =========================================================
    // CANCEL RETURN - NOT FOUND
    // =========================================================

    @Test
    void testCancelReturnNotFound() {

        when(orderRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                OrderNotFoundException.class,
                () -> orderService.cancelReturn(999L));

        verify(orderRepository, never())
                .save(any(Order.class));
    }
}