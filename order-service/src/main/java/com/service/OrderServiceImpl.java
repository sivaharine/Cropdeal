package com.service;

import com.client.PaymentServiceClient;
import com.dto.*;
import com.entity.Order;
import com.entity.OrderStatus;
import com.exception.OrderNotFoundException;
import com.repository.OrderRepository;
import feign.FeignException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.client.InvoiceServiceClient;
import com.client.PaymentServiceClient;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final PaymentServiceClient paymentServiceClient;
    private final InvoiceServiceClient invoiceServiceClient;
    private final OrderEventPublisher eventPublisher;
    private final OrderSagaOrchestrator sagaOrchestrator;

    @Autowired
    public OrderServiceImpl(
            OrderRepository orderRepository,
            PaymentServiceClient paymentServiceClient,
            @Autowired(required = false) InvoiceServiceClient invoiceServiceClient,
            @Autowired(required = false) OrderEventPublisher eventPublisher,
            @Autowired(required = false) OrderSagaOrchestrator sagaOrchestrator) {

        this.orderRepository = orderRepository;
        this.paymentServiceClient = paymentServiceClient;
        this.invoiceServiceClient = invoiceServiceClient;
        this.eventPublisher = eventPublisher;
        this.sagaOrchestrator = sagaOrchestrator;
    }

    @Override
    public OrderResponse createOrder(CreateOrderRequest request) {

        Order order = new Order();

        order.setFarmerId(request.getFarmerId());
        order.setDealerId(request.getDealerId());
        order.setCropId(request.getCropId());
        order.setCropName(request.getCropName());
        order.setQuantity(request.getQuantity());
        order.setUnitPrice(request.getUnitPrice());
        order.setDealerName(request.getDealerName());
        order.setFarmerName(request.getFarmerName());
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setFulfillmentType(request.getFulfillmentType());
        order.setPaymentMethod(request.getPaymentMethod());
        order.setTransactionId(request.getTransactionId());
        order.setIsBidding(request.getIsBidding());

        BigDecimal totalAmount = request.getTotalPrice() != null ? request.getTotalPrice() :
                request.getUnitPrice().multiply(BigDecimal.valueOf(request.getQuantity()));

        order.setTotalAmount(totalAmount);

        order.setStatus(OrderStatus.PAID);

        Order savedOrder = orderRepository.save(order);

        if (eventPublisher != null) {
            try {
                eventPublisher.publishOrderPlacedEvent(
                        savedOrder.getId(),
                        savedOrder.getCropName(),
                        savedOrder.getTotalAmount(),
                        savedOrder.getDealerId(),
                        savedOrder.getFarmerId()
                );
            } catch (Exception ignored) {}
        }

        return convertToResponse(savedOrder);
    }

    @Override
    public List<OrderResponse> getAllOrders() {

        return orderRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public OrderResponse getOrderById(Long id) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() ->
                        new OrderNotFoundException("Order not found with id: " + id));

        return convertToResponse(order);
    }

    @Override
    public List<OrderResponse> getOrdersByDealer(Long dealerId) {

        return orderRepository.findByDealerId(dealerId)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderResponse> getOrdersByFarmer(Long farmerId) {

        return orderRepository.findByFarmerId(farmerId)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PaymentResponse payOrder(
            Long orderId,
            PayOrderRequest request) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new OrderNotFoundException(
                                "Order not found with id: " + orderId));

        if (order.getStatus() == OrderStatus.PAID) {
            throw new IllegalStateException(
                    "Order is already paid");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException(
                    "Cancelled order cannot be paid");
        }

        if (order.getStatus() == OrderStatus.RETURNED ||
                order.getStatus() == OrderStatus.REFUNDED) {

            throw new IllegalStateException(
                    "Returned/refunded order cannot be paid");
        }

        order.setStatus(OrderStatus.PAYMENT_PENDING);
        if (request.getPaymentMethod() != null) {
            order.setPaymentMethod(request.getPaymentMethod());
        }
        orderRepository.save(order);

        try {
            PaymentResponse paymentResponse;
            if (sagaOrchestrator != null) {
                paymentResponse = sagaOrchestrator.executePaymentWithResilience(order);
            } else {
                PaymentRequest paymentRequest = new PaymentRequest();
                paymentRequest.setOrderId(order.getId());
                paymentRequest.setDealerId(order.getDealerId());
                paymentRequest.setFarmerId(order.getFarmerId());
                paymentRequest.setAmount(order.getTotalAmount());
                paymentRequest.setPaymentMethod(request.getPaymentMethod());
                paymentResponse = paymentServiceClient.makePayment(paymentRequest);
            }

            if (paymentResponse != null && "SUCCESS".equalsIgnoreCase(paymentResponse.getStatus())) {
                order.setStatus(OrderStatus.PAID);
                if (eventPublisher != null) {
                    try {
                        eventPublisher.publishOrderCompletedEvent(order.getId(), "PAID");
                    } catch (Exception ignored) {}
                }
            } else {
                order.setStatus(OrderStatus.PAYMENT_PENDING);
            }

            orderRepository.save(order);
            return paymentResponse;

        } catch (FeignException e) {

            order.setStatus(OrderStatus.PAYMENT_PENDING);
            orderRepository.save(order);

            throw new IllegalStateException(
                    "Payment Service is unavailable");
        }
    }

    @Override
    public OrderResponse updateOrder(
            Long id,
            UpdateOrderRequest request) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() ->
                        new OrderNotFoundException(
                                "Order not found with id: " + id));

        if (order.getStatus() == OrderStatus.PAID ||
                order.getStatus() == OrderStatus.CONFIRMED ||
                order.getStatus() == OrderStatus.SHIPPED ||
                order.getStatus() == OrderStatus.OUT_FOR_DELIVERY ||
                order.getStatus() == OrderStatus.DELIVERED ||
                order.getStatus() == OrderStatus.RETURNED ||
                order.getStatus() == OrderStatus.REFUNDED ||
                order.getStatus() == OrderStatus.CANCELLED) {

            throw new IllegalStateException(
                    "Order cannot be updated in status: "
                            + order.getStatus());
        }

        if (request.getFarmerId() != null) {
            order.setFarmerId(request.getFarmerId());
        }

        if (request.getDealerId() != null) {
            order.setDealerId(request.getDealerId());
        }

        if (request.getCropId() != null) {
            order.setCropId(request.getCropId());
        }

        if (request.getCropName() != null &&
                !request.getCropName().isBlank()) {

            order.setCropName(request.getCropName());
        }

        if (request.getQuantity() != null) {
            order.setQuantity(request.getQuantity());
        }

        if (request.getUnitPrice() != null) {
            order.setUnitPrice(request.getUnitPrice());
        }

        if (order.getQuantity() != null &&
                order.getUnitPrice() != null) {

            BigDecimal total =
                    order.getUnitPrice()
                            .multiply(
                                    BigDecimal.valueOf(
                                            order.getQuantity()));

            order.setTotalAmount(total);
        }

        Order updatedOrder =
                orderRepository.save(order);

        return convertToResponse(updatedOrder);
    }

    @Override
    public void deleteOrder(Long id) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() ->
                        new OrderNotFoundException(
                                "Order not found with id: " + id));

        if (order.getStatus() == OrderStatus.PAID ||
                order.getStatus() == OrderStatus.CONFIRMED ||
                order.getStatus() == OrderStatus.SHIPPED ||
                order.getStatus() == OrderStatus.OUT_FOR_DELIVERY ||
                order.getStatus() == OrderStatus.DELIVERED ||
                order.getStatus() == OrderStatus.RETURNED ||
                order.getStatus() == OrderStatus.REFUNDED) {

            throw new IllegalStateException(
                    "Order cannot be deleted in status: "
                            + order.getStatus());
        }

        orderRepository.delete(order);
    }

    @Override
    public OrderResponse updateOrderStatus(
            Long id,
            UpdateOrderStatusRequest request) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() ->
                        new OrderNotFoundException(
                                "Order not found with id: " + id));

        OrderStatus newStatus;

        try {

            newStatus = OrderStatus.valueOf(
                    request.getStatus().trim().toUpperCase());

        } catch (IllegalArgumentException e) {

            throw new IllegalArgumentException(
                    "Invalid order status: "
                            + request.getStatus());
        }

        order.setStatus(newStatus);

        return convertToResponse(
                orderRepository.save(order));
    }

    @Override
    public OrderResponse requestReturn(Long id) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() ->
                        new OrderNotFoundException(
                                "Order not found with id: " + id));

        if (order.getStatus() != OrderStatus.PAID &&
                order.getStatus() != OrderStatus.DELIVERED) {

            throw new IllegalStateException(
                    "Return can only be requested for a paid or delivered order");
        }

        order.setStatus(OrderStatus.RETURN_REQUESTED);

        return convertToResponse(
                orderRepository.save(order));
    }

    @Override
    public OrderResponse cancelReturn(Long id) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() ->
                        new OrderNotFoundException(
                                "Order not found with id: " + id));

        if (order.getStatus() != OrderStatus.RETURN_REQUESTED) {

            throw new IllegalStateException(
                    "Return can only be cancelled when return is requested");
        }

        /*
         * We restore the order to PAID instead of CANCELLED.
         * CANCELLED means the complete order itself is cancelled.
         */
        order.setStatus(OrderStatus.PAID);

        return convertToResponse(
                orderRepository.save(order));
    }

    private OrderResponse convertToResponse(Order order) {

        OrderResponse response = new OrderResponse();

        response.setId(order.getId());
        response.setFarmerId(order.getFarmerId());
        response.setDealerId(order.getDealerId());
        response.setCropId(order.getCropId());
        response.setCropName(order.getCropName());
        response.setQuantity(order.getQuantity());
        response.setUnitPrice(order.getUnitPrice());
        response.setTotalAmount(order.getTotalAmount());

        response.setDealerName(order.getDealerName());
        response.setFarmerName(order.getFarmerName());
        response.setDeliveryAddress(order.getDeliveryAddress());
        response.setFulfillmentType(order.getFulfillmentType());
        response.setPaymentMethod(order.getPaymentMethod());
        response.setTransactionId(order.getTransactionId());
        response.setIsBidding(order.getIsBidding());

        if (order.getStatus() != null) {
            response.setStatus(
                    order.getStatus().name());
        }

        response.setCreatedAt(order.getCreatedAt());
        response.setUpdatedAt(order.getUpdatedAt());

        return response;
    }

    @Override
    public byte[] downloadInvoicePdf(Long orderId) {

        orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new OrderNotFoundException(
                                "Order not found with id: " + orderId));

        if (invoiceServiceClient != null) {
            return invoiceServiceClient.downloadInvoicePdfByOrderId(orderId);
        }

        throw new IllegalStateException("Invoice service is currently unavailable");
    }
}