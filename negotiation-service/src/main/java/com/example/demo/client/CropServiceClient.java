package com.example.demo.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class CropServiceClient {

    private final RestClient.Builder restClientBuilder;

    public CropServiceClient(RestClient.Builder restClientBuilder) {
        this.restClientBuilder = restClientBuilder;
    }

    public boolean cropExists(Long cropId) {
        return cropId != null;
    }
}
