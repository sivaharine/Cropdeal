package com.cropdeal.auth.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.Map;

@FeignClient(
        name = "price-alert-service",
        url = "${price-alert-service.url:http://localhost:8094}"
)
public interface PriceAlertServiceClient {

    @PostMapping("/api/price-alerts/check-on-login/{userId}")
    ResponseEntity<Map<String, Object>> checkPriceAlertsOnLogin(
            @PathVariable("userId") Long userId
    );
}
