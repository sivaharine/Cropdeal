package com.cropdeal.pricealert.client;

import com.cropdeal.pricealert.dto.DatabasePriceDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Collections;
import java.util.List;

@Component
public class PriceServiceClient {

    private static final Logger log = LoggerFactory.getLogger(PriceServiceClient.class);

    private final RestClient restClient;
    private final String priceServiceUrl;

    public PriceServiceClient(
            @Value("${price-service.url:http://localhost:8084}") String priceServiceUrl) {
        this.restClient = RestClient.builder().build();
        this.priceServiceUrl = priceServiceUrl;
    }

    /**
     * Fetches all latest prices stored in the CropDeal database from price-service.
     * Does NOT query external government APIs.
     */
    public List<DatabasePriceDto> getLatestStoredPricesFromDb() {
        try {
            log.info("Querying stored prices from price-service database at {}/api/prices/all", priceServiceUrl);
            List<DatabasePriceDto> prices = restClient.get()
                    .uri(priceServiceUrl + "/api/prices/all")
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<DatabasePriceDto>>() {});

            return prices != null ? prices : Collections.emptyList();
        } catch (Exception ex) {
            log.warn("Could not retrieve stored prices from price-service: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }
}
