package com.cropdeal.cropservice.client;

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

    public PriceAlertClient(RestClient restClient,
                            @Value("${crop-service.price-alert-service-url:http://localhost:8094}") String priceAlertServiceUrl) {
        this.restClient = restClient;
        this.priceAlertServiceUrl = priceAlertServiceUrl;
    }

    public void triggerPriceAlertMatch(Long listingId, Long farmerId, String cropName,
                                       BigDecimal price, Double quantity, String unit,
                                       String district, String state) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("listingId", listingId);
            body.put("farmerId", farmerId);
            body.put("cropName", cropName);
            body.put("price", price);
            body.put("quantity", quantity);
            body.put("unit", unit != null ? unit : "kg");
            body.put("district", district);
            body.put("state", state);

            log.info("Triggering real-time price match on price-alert-service for crop listing #{}", listingId);

            restClient.post()
                    .uri(priceAlertServiceUrl + "/api/price-alerts/match/crop-listing")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Successfully dispatched price match request for crop listing #{}", listingId);
        } catch (Exception ex) {
            log.warn("Could not dispatch price match to price-alert-service for crop listing #{}: {}",
                    listingId, ex.getMessage());
        }
    }
}
