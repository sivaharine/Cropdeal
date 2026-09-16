package com.cropdeal.admin.client;

import com.cropdeal.admin.dto.client.PaymentClientDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@FeignClient(name = "payment-service")
public interface PaymentServiceClient {

    @GetMapping("/api/payments")
    List<PaymentClientDto> getAllPayments();

    @GetMapping("/api/payments/{id}")
    PaymentClientDto getPaymentById(@PathVariable("id") Long id);
}
