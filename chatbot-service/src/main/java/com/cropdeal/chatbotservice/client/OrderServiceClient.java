package com.cropdeal.chatbotservice.client;

import com.cropdeal.chatbotservice.dto.OrderResponse;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class OrderServiceClient {
    private final RestClient restClient;

    public OrderServiceClient(@Qualifier("orderServiceRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public List<OrderResponse> getOrdersForProfile(String role, Long profileId) {
        String path = "FARMER".equalsIgnoreCase(role)
                ? "/api/orders/farmer/{profileId}"
                : "/api/orders/dealer/{profileId}";
        try {
            return restClient.get()
                    .uri(path, profileId)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });
        } catch (RestClientException e) {
            return List.of();
        }
    }
}
