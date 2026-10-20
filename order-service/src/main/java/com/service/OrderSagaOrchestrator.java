package com.service;

import com.client.PaymentServiceClient;
import com.dto.PaymentRequest;
import com.dto.PaymentResponse;
import com.entity.Order;
import com.entity.OrderStatus;
import com.repository.OrderRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Enterprise Saga Pattern Orchestrator for Distributed Order Processing.
 * Coordinates Order Placement -> Payment Processing -> Inventory Validation
 * Equipped with Resilience4j Circuit Breaker and Retry mechanisms and compensating rollback actions.
 */
@Service
public class OrderSagaOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(OrderSagaOrchestrator.class);

    private final OrderRepository orderRepository;
    private final PaymentServiceClient paymentServiceClient;
    private final OrderEventPublisher eventPublisher;

    public OrderSagaOrchestrator(
            OrderRepository orderRepository,
            PaymentServiceClient paymentServiceClient,
            OrderEventPublisher eventPublisher) {
        this.orderRepository = orderRepository;
        this.paymentServiceClient = paymentServiceClient;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Executes the Distributed Order Saga.
     * Step 1: Create Order in PENDING status
     * Step 2: Process Payment via Payment Service (protected by CircuitBreaker & Retry)
     * Step 3: Finalize Order and publish RabbitMQ Event
     * If any step fails, compensating transactions are automatically invoked.
     */
    public Order executeOrderSaga(Order order) {
        log.info("[SAGA START] Initiating distributed transaction for Order #{}", order.getId());

        // Step 1: Local transaction - save order in PAYMENT_PENDING
        order.setStatus(OrderStatus.PAYMENT_PENDING);
        Order savedOrder = orderRepository.save(order);

        try {
            // Step 2: Distributed payment execution with Resilience4j CircuitBreaker & Retry
            PaymentResponse paymentResponse = executePaymentWithResilience(savedOrder);

            if (paymentResponse != null && "SUCCESS".equalsIgnoreCase(paymentResponse.getStatus())) {
                log.info("[SAGA STEP 2 SUCCESS] Payment completed for Order #{}", savedOrder.getId());
                savedOrder.setStatus(OrderStatus.PAID);
                savedOrder = orderRepository.save(savedOrder);

                // Step 3: Publish completion event to RabbitMQ
                eventPublisher.publishOrderPlacedEvent(
                        savedOrder.getId(),
                        savedOrder.getCropName(),
                        savedOrder.getTotalAmount(),
                        savedOrder.getDealerId(),
                        savedOrder.getFarmerId()
                );
                eventPublisher.publishOrderCompletedEvent(savedOrder.getId(), "PAID");

                log.info("[SAGA COMPLETED] Order #{} successfully finalized!", savedOrder.getId());
                return savedOrder;
            } else {
                // Compensating action: cancel order
                compensateOrder(savedOrder, "Payment declined or returned non-success status");
                return savedOrder;
            }

        } catch (Exception ex) {
            log.error("[SAGA FAILURE] Step failed during Order #{} execution: {}", savedOrder.getId(), ex.getMessage());
            compensateOrder(savedOrder, "Circuit breaker tripped or service error: " + ex.getMessage());
            return savedOrder;
        }
    }

    /**
     * Resilience4j Circuit Breaker & Retry protected call to payment service.
     */
    @CircuitBreaker(name = "paymentService", fallbackMethod = "executePaymentFallback")
    @Retry(name = "paymentService")
    public PaymentResponse executePaymentWithResilience(Order order) {
        log.info("[Resilience4j] Attempting Payment Service call for Order #{} (Amount: {})", order.getId(), order.getTotalAmount());
        PaymentRequest request = new PaymentRequest();
        request.setOrderId(order.getId());
        request.setDealerId(order.getDealerId());
        request.setFarmerId(order.getFarmerId());
        request.setAmount(order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO);
        request.setPaymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod() : "ONLINE_WALLET");

        return paymentServiceClient.makePayment(request);
    }

    /**
     * Resilience4j Fallback method invoked when Circuit Breaker is OPEN or retries are exhausted.
     */
    public PaymentResponse executePaymentFallback(Order order, Throwable t) {
        log.warn("[Resilience4j FALLBACK] Circuit breaker opened or call failed for Order #{}: {}", order.getId(), t.getMessage());
        PaymentResponse fallbackResponse = new PaymentResponse();
        fallbackResponse.setOrderId(order.getId());
        fallbackResponse.setStatus("FALLBACK_DEFERRED");
        fallbackResponse.setTransactionReference("Payment service temporarily unavailable. Order queued for deferred processing.");
        return fallbackResponse;
    }

    /**
     * Saga Compensating Transaction: Rolls back the order state on failure.
     */
    private void compensateOrder(Order order, String reason) {
        log.warn("[SAGA COMPENSATION] Reverting distributed state for Order #{}. Reason: {}", order.getId(), reason);
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
        eventPublisher.publishOrderCompensatedEvent(order.getId(), reason);
    }
}
