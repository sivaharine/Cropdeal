package com.cropdeal.chatbotservice.client;

import com.cropdeal.chatbotservice.dto.CropPriceResponse;
import com.cropdeal.chatbotservice.dto.PriceSearchRequest;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class PriceServiceClient {
    private final RestClient restClient;

    public PriceServiceClient(@Qualifier("priceServiceRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public List<CropPriceResponse> getAllLatestPrices() {
        try {
            return restClient.get()
                    .uri("/api/prices/all")
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });
        } catch (RestClientException e) {
            return List.of();
        }
    }

    public CropPriceResponse lookup(PriceSearchRequest request) {
        try {
            return restClient.post()
                    .uri("/api/prices/lookup")
                    .body(request)
                    .retrieve()
                    .body(CropPriceResponse.class);
        } catch (RestClientException e) {
            return null;
        }
    }
}
