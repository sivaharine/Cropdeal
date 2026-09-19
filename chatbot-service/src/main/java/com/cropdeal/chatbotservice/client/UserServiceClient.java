package com.cropdeal.chatbotservice.client;

import com.cropdeal.chatbotservice.dto.ProfileLookupResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class UserServiceClient {
    private final RestClient restClient;

    public UserServiceClient(@Qualifier("userServiceRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public ProfileLookupResponse findProfile(Long userId, String role) {
        try {
            return restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/users/internal/profile/{userId}")
                            .queryParam("role", role)
                            .build(userId))
                    .retrieve()
                    .body(ProfileLookupResponse.class);
        } catch (RestClientException e) {
            return null;
        }
    }
}
