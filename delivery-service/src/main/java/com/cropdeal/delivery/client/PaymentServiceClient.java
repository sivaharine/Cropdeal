package com.cropdeal.delivery.client;

import com.cropdeal.delivery.dto.WalletResponse;
import com.cropdeal.delivery.dto.WalletSettlementRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "payment-service")
public interface PaymentServiceClient {

    @PostMapping("/api/payments/wallet/settlement")
    WalletResponse creditWallet(@RequestBody WalletSettlementRequest request);
}