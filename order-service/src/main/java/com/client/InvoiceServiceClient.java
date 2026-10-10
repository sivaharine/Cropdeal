package com.client;

import com.config.FeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
        name = "invoice-service",
        configuration = FeignConfig.class
)
public interface InvoiceServiceClient {

    @GetMapping("/api/invoices/order/{orderId}/pdf")
    byte[] downloadInvoicePdfByOrderId(@PathVariable("orderId") Long orderId);
}
