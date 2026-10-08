package com.cropdeal.priceservice.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Component
public class PriceAlertClient {

    private static final Logger log = LoggerFactory.getLogger(PriceAlertClient.class);

    private final RestClient restClient;
    private final String priceAlertServiceUrl;

    public PriceAlertClient(@Value("${price-service.price-alert-service-url:http://localhost:8094}") String priceAlertServiceUrl) {
        this.restClient = RestClient.builder().build();
        this.priceAlertServiceUrl = priceAlertServiceUrl;
    }

    public void triggerMarketPriceMatch(Long priceId, String cropName, BigDecimal marketPrice,
                                        String marketName, String district, String state, String unit) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("priceId", priceId);
            body.put("cropName", cropName);
            body.put("marketPrice", marketPrice);
            body.put("marketName", marketName);
            body.put("district", district);
            body.put("state", state);
            body.put("unit", unit != null ? unit : "kg");

            log.info("Triggering market price match for crop={}, price={}, market={}", cropName, marketPrice, marketName);

            restClient.post()
                    .uri(priceAlertServiceUrl + "/api/price-alerts/match/market-price")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Successfully dispatched market price match for priceId={}", priceId);
        } catch (Exception ex) {
            log.warn("Could not dispatch market price match to price-alert-service: {}", ex.getMessage());
        }
    }
}
