package com.cropdeal.chatbotservice.client;

import com.cropdeal.chatbotservice.dto.DeliveryResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class DeliveryServiceClient {
    private final RestClient restClient;

    public DeliveryServiceClient(@Qualifier("deliveryServiceRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public DeliveryResponse getDeliveryByOrderId(Long orderId) {
        try {
            return restClient.get()
                    .uri("/api/deliveries/order/{orderId}", orderId)
                    .retrieve()
                    .body(DeliveryResponse.class);
        } catch (RestClientException e) {
            return null;
        }
    }
}
