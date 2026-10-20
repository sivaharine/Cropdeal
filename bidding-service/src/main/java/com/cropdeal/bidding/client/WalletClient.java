package com.cropdeal.bidding.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.math.BigDecimal;

@FeignClient(name = "wallet-service")
public interface WalletClient {

    record ReserveRequest(Long userId, String referenceId, BigDecimal amount) {}
    record ReleaseRequest(Long userId, String referenceId) {}
    record ConsumeRequest(Long userId, String referenceId) {}

    @PostMapping("/api/wallet/reserve")
    void reserveFunds(@RequestBody ReserveRequest request);

    @PostMapping("/api/wallet/release")
    void releaseFunds(@RequestBody ReleaseRequest request);

    @PostMapping("/api/wallet/consume")
    void consumeFunds(@RequestBody ConsumeRequest request);
}