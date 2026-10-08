package com.saga;

import com.dto.CreateOrderRequest;
import com.dto.DeliveryAssignmentRequest;
import com.dto.DeliveryResponse;
import com.dto.InvoicePaymentRequest;
import com.dto.OrderResponse;
import com.dto.PaymentRequest;
import com.dto.PaymentResponse;
import com.dto.QuantityUpdateRequest;
import com.dto.SagaOrderRequest;
import com.entity.Order;
import com.entity.OrderStatus;
import com.exception.OrderNotFoundException;
import com.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class OrderSagaService {

    private final OrderRepository orderRepository;
    private final OrderSagaRemoteClient remoteClient;

    public OrderSagaService(
            OrderRepository orderRepository,
            OrderSagaRemoteClient remoteClient) {

        this.orderRepository = orderRepository;
        this.remoteClient = remoteClient;
    }

    public OrderResponse startOrderSaga(SagaOrderRequest request) {
        Order order = createOrder(request.getOrder());
        boolean paymentCompleted = false;
        boolean cropReserved = false;
        boolean deliveryCreated = false;

        try {
            PaymentResponse payment = takePayment(order, request.getPaymentMethod());
            paymentCompleted = true;
            updateStatus(order.getId(), OrderStatus.PAID);

            remoteClient.reduceQuantity(
                    order.getCropId(),
                    new QuantityUpdateRequest(BigDecimal.valueOf(order.getQuantity())));
            cropReserved = true;
            updateStatus(order.getId(), OrderStatus.CROP_RESERVED);

            createDelivery(order, request);
            deliveryCreated = true;
            updateStatus(order.getId(), OrderStatus.DELIVERY_CREATED);

            generateInvoice(order, payment);
            updateStatus(order.getId(), OrderStatus.INVOICE_GENERATED);

            Order completedOrder = updateStatus(order.getId(), OrderStatus.CONFIRMED);
            return mapToResponse(completedOrder);
        } catch (Exception ex) {
            compensate(order, paymentCompleted, cropReserved, deliveryCreated);
            Order failedOrder = updateStatus(order.getId(), OrderStatus.SAGA_FAILED);
            return mapToResponse(failedOrder);
        }
    }

    @Transactional
    protected Order createOrder(CreateOrderRequest request) {
        BigDecimal totalAmount =
                request.getUnitPrice().multiply(BigDecimal.valueOf(request.getQuantity()));

        Order order = new Order();
        order.setFarmerId(request.getFarmerId());
        order.setDealerId(request.getDealerId());
        order.setCropId(request.getCropId());
        order.setCropName(request.getCropName());
        order.setQuantity(request.getQuantity());
        order.setUnitPrice(request.getUnitPrice());
        order.setTotalAmount(totalAmount);
        order.setStatus(OrderStatus.CREATED);

        return orderRepository.save(order);
    }

    private PaymentResponse takePayment(Order order, String paymentMethod) {
        PaymentRequest paymentRequest = new PaymentRequest();
        paymentRequest.setOrderId(order.getId());
        paymentRequest.setDealerId(order.getDealerId());
        paymentRequest.setFarmerId(order.getFarmerId());
        paymentRequest.setAmount(order.getTotalAmount());
        paymentRequest.setPaymentMethod(paymentMethod);

        PaymentResponse response = remoteClient.makePayment(paymentRequest);
        if (response == null || !"SUCCESS".equalsIgnoreCase(response.getStatus())) {
            updateStatus(order.getId(), OrderStatus.PAYMENT_FAILED);
            throw new IllegalStateException("Payment failed for order " + order.getId());
        }
        return response;
    }

    private void createDelivery(Order order, SagaOrderRequest request) {
        DeliveryAssignmentRequest deliveryRequest = new DeliveryAssignmentRequest();
        deliveryRequest.setOrderId(order.getId());
        deliveryRequest.setDeliveryOption(request.getDeliveryOption());
        deliveryRequest.setCustomerPhone(request.getCustomerPhone());
        deliveryRequest.setPickupAddress(request.getPickupAddress());
        deliveryRequest.setDeliveryAddress(request.getDeliveryAddress());
        deliveryRequest.setDeliveryCharge(request.getDeliveryCharge());
        deliveryRequest.setPaymentCompleted(true);
        deliveryRequest.setPaymentMethod(request.getPaymentMethod());

        remoteClient.createDelivery(deliveryRequest);
    }

    private void generateInvoice(Order order, PaymentResponse payment) {
        InvoicePaymentRequest invoiceRequest = new InvoicePaymentRequest();
        invoiceRequest.setPaymentId(payment.getId());
        invoiceRequest.setOrderId(order.getId());
        invoiceRequest.setDealerId(order.getDealerId());
        invoiceRequest.setFarmerId(order.getFarmerId());
        invoiceRequest.setAmount(order.getTotalAmount());
        invoiceRequest.setPaymentMethod(payment.getPaymentMethod());
        invoiceRequest.setPaymentStatus(payment.getStatus());
        invoiceRequest.setTransactionReference(payment.getTransactionReference());
        invoiceRequest.setPaidAt(payment.getPaidAt());

        remoteClient.generateInvoiceFromPayment(invoiceRequest);
    }

    private void compensate(
            Order order,
            boolean paymentCompleted,
            boolean cropReserved,
            boolean deliveryCreated) {

        if (deliveryCreated) {
            try {
                DeliveryResponse delivery =
                        remoteClient.getDeliveryByOrderId(order.getId());
                if (delivery != null && delivery.getId() != null) {
                    remoteClient.cancelDelivery(delivery.getId());
                }
            } catch (Exception ignored) {
            }
        }

        if (cropReserved) {
            try {
                remoteClient.restoreQuantity(
                        order.getCropId(),
                        new QuantityUpdateRequest(BigDecimal.valueOf(order.getQuantity())));
            } catch (Exception ignored) {
            }
        }

        if (paymentCompleted) {
            try {
                remoteClient.refundPaymentByOrderId(order.getId());
            } catch (Exception ignored) {
            }
        }
    }

    @Transactional
    protected Order updateStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(
                        "Order not found with id: " + orderId));
        order.setStatus(status);
        return orderRepository.save(order);
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
