package com.client;

import com.config.FeignConfig;
import com.dto.PaymentRequest;
import com.dto.PaymentResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(
        name = "payment-service",
        configuration = FeignConfig.class
)
public interface PaymentServiceClient {

    @PostMapping("/api/payments")
    PaymentResponse makePayment(@RequestBody PaymentRequest request);
}