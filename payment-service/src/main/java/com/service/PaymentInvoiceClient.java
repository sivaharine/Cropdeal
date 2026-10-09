package com.service;

import com.client.InvoiceServiceClient;
import com.dto.InvoicePaymentRequest;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class PaymentInvoiceClient {

    private static final Logger log = LoggerFactory.getLogger(PaymentInvoiceClient.class);

    private final InvoiceServiceClient invoiceServiceClient;

    public PaymentInvoiceClient(InvoiceServiceClient invoiceServiceClient) {
        this.invoiceServiceClient = invoiceServiceClient;
    }

    @CircuitBreaker(name = "invoiceService", fallbackMethod = "invoiceFallback")
    @Retry(name = "invoiceService")
    public void generateInvoiceFromPayment(InvoicePaymentRequest request) {
        invoiceServiceClient.generateInvoiceFromPayment(request);
    }

    private void invoiceFallback(InvoicePaymentRequest request, Throwable ex) {
        log.warn(
                "Invoice service unavailable for order {} after payment. Payment remains successful and invoice can be generated later: {}",
                request.getOrderId(),
                ex.getMessage());
    }
}
