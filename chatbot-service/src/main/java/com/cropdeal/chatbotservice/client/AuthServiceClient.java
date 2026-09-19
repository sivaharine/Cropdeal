package com.cropdeal.chatbotservice.client;

import com.cropdeal.chatbotservice.dto.AuthUserLookupResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class AuthServiceClient {
    private final RestClient restClient;

    public AuthServiceClient(@Qualifier("authServiceRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public AuthUserLookupResponse findByEmail(String email) {
        try {
            return restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/auth/internal/users/by-email")
                            .queryParam("email", email)
                            .build())
                    .retrieve()
                    .body(AuthUserLookupResponse.class);
        } catch (RestClientException e) {
            return null;
        }
    }
}
