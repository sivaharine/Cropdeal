package com.saga;

import com.client.CropServiceClient;
import com.client.DeliveryServiceClient;
import com.client.InvoiceServiceClient;
import com.client.PaymentServiceClient;
import com.dto.CropResponse;
import com.dto.DeliveryAssignmentRequest;
import com.dto.DeliveryResponse;
import com.dto.InvoicePaymentRequest;
import com.dto.InvoiceResponse;
import com.dto.PaymentRequest;
import com.dto.PaymentResponse;
import com.dto.QuantityUpdateRequest;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.stereotype.Component;

@Component
public class OrderSagaRemoteClient {

    private final PaymentServiceClient paymentServiceClient;
    private final CropServiceClient cropServiceClient;
    private final DeliveryServiceClient deliveryServiceClient;
    private final InvoiceServiceClient invoiceServiceClient;

    public OrderSagaRemoteClient(
            PaymentServiceClient paymentServiceClient,
            CropServiceClient cropServiceClient,
            DeliveryServiceClient deliveryServiceClient,
            InvoiceServiceClient invoiceServiceClient) {

        this.paymentServiceClient = paymentServiceClient;
        this.cropServiceClient = cropServiceClient;
        this.deliveryServiceClient = deliveryServiceClient;
        this.invoiceServiceClient = invoiceServiceClient;
    }

    @CircuitBreaker(name = "paymentService", fallbackMethod = "paymentFallback")
    @Retry(name = "paymentService")
    public PaymentResponse makePayment(PaymentRequest request) {
        return paymentServiceClient.makePayment(request);
    }

    @CircuitBreaker(name = "paymentService", fallbackMethod = "paymentRefundFallback")
    @Retry(name = "paymentService")
    public PaymentResponse refundPaymentByOrderId(Long orderId) {
        return paymentServiceClient.refundPaymentByOrderId(orderId);
    }

    @CircuitBreaker(name = "cropService", fallbackMethod = "cropReduceFallback")
    @Retry(name = "cropService")
    public CropResponse reduceQuantity(Long cropId, QuantityUpdateRequest request) {
        return cropServiceClient.reduceQuantity(cropId, request);
    }

    @CircuitBreaker(name = "cropService", fallbackMethod = "cropRestoreFallback")
    @Retry(name = "cropService")
    public CropResponse restoreQuantity(Long cropId, QuantityUpdateRequest request) {
        return cropServiceClient.restoreQuantity(cropId, request);
    }

    @CircuitBreaker(name = "deliveryService", fallbackMethod = "deliveryCreateFallback")
    @Retry(name = "deliveryService")
    public DeliveryResponse createDelivery(DeliveryAssignmentRequest request) {
        return deliveryServiceClient.createDelivery(request);
    }

    @CircuitBreaker(name = "deliveryService", fallbackMethod = "deliveryLookupFallback")
    @Retry(name = "deliveryService")
    public DeliveryResponse getDeliveryByOrderId(Long orderId) {
        return deliveryServiceClient.getDeliveryByOrderId(orderId);
    }

    @CircuitBreaker(name = "deliveryService", fallbackMethod = "deliveryCancelFallback")
    @Retry(name = "deliveryService")
    public void cancelDelivery(Long deliveryId) {
        deliveryServiceClient.cancelDelivery(deliveryId);
    }

    @CircuitBreaker(name = "invoiceService", fallbackMethod = "invoiceFallback")
    @Retry(name = "invoiceService")
    public InvoiceResponse generateInvoiceFromPayment(InvoicePaymentRequest request) {
        return invoiceServiceClient.generateInvoiceFromPayment(request);
    }

    private PaymentResponse paymentFallback(PaymentRequest request, Throwable ex) {
        throw unavailable("payment-service", ex);
    }

    private PaymentResponse paymentRefundFallback(Long orderId, Throwable ex) {
        throw unavailable("payment-service refund", ex);
    }

    private CropResponse cropReduceFallback(Long cropId, QuantityUpdateRequest request, Throwable ex) {
        throw unavailable("crop-service quantity reservation", ex);
    }

    private CropResponse cropRestoreFallback(Long cropId, QuantityUpdateRequest request, Throwable ex) {
        throw unavailable("crop-service quantity restoration", ex);
    }

    private DeliveryResponse deliveryCreateFallback(DeliveryAssignmentRequest request, Throwable ex) {
        throw unavailable("delivery-service", ex);
    }

    private DeliveryResponse deliveryLookupFallback(Long orderId, Throwable ex) {
        throw unavailable("delivery-service lookup", ex);
    }

    private void deliveryCancelFallback(Long deliveryId, Throwable ex) {
        throw unavailable("delivery-service cancellation", ex);
    }

    private InvoiceResponse invoiceFallback(InvoicePaymentRequest request, Throwable ex) {
        throw unavailable("invoice-service", ex);
    }

    private IllegalStateException unavailable(String dependency, Throwable ex) {
        return new IllegalStateException(
                dependency + " is unavailable. Saga will be compensated.",
                ex);
    }
}
