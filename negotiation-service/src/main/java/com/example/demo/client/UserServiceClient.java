package com.example.demo.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class UserServiceClient {

    private final RestClient.Builder restClientBuilder;

    public UserServiceClient(RestClient.Builder restClientBuilder) {
        this.restClientBuilder = restClientBuilder;
    }

    public boolean userExists(Long userId) {
        return userId != null;
    }
}
