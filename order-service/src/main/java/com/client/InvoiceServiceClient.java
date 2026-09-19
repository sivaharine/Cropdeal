package com.client;

import com.config.FeignConfig;
import com.dto.InvoicePaymentRequest;
import com.dto.InvoiceResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(
        name = "invoice-service",
        configuration = FeignConfig.class
)
public interface InvoiceServiceClient {

    @PostMapping("/api/invoices/payment")
    InvoiceResponse generateInvoiceFromPayment(@RequestBody InvoicePaymentRequest request);
}
