package com.example.demo.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class OrderServiceClient {

    private final RestClient.Builder restClientBuilder;

    public OrderServiceClient(RestClient.Builder restClientBuilder) {
        this.restClientBuilder = restClientBuilder;
    }

    public void createOrderFromAcceptedOffer(Long offerId) {
        if (offerId == null) {
            throw new IllegalArgumentException("offerId is required");
        }
    }
}
