package com.cropdeal.bidding.client;

import com.cropdeal.bidding.dto.WalletDto.*;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "payment-service")
public interface PaymentServiceClient {

    @GetMapping("/api/payments/wallet/{userId}")
    WalletResponse getWallet(@PathVariable("userId") Long userId);

    @PostMapping("/api/payments/wallet/debit")
    WalletResponse debitWallet(@RequestBody WalletDebitRequest request);

    @PostMapping("/api/payments/wallet/credit")
    WalletResponse creditWallet(@RequestBody WalletCreditRequest request);
}