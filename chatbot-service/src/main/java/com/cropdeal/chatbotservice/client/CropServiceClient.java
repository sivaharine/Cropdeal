package com.cropdeal.chatbotservice.client;

import com.cropdeal.chatbotservice.dto.CropSearchResponse;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class CropServiceClient {
    private final RestClient restClient;

    public CropServiceClient(@Qualifier("cropServiceRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public List<CropSearchResponse> search(String commodity, String state, String district, String grade) {
        try {
            return restClient.get()
                    .uri(uriBuilder -> {
                        var builder = uriBuilder.path("/api/crops/search");
                        addQueryParam(builder, "commodity", commodity);
                        addQueryParam(builder, "state", state);
                        addQueryParam(builder, "district", district);
                        addQueryParam(builder, "grade", grade);
                        return builder.build();
                    })
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });
        } catch (RestClientException e) {
            return List.of();
        }
    }

    private void addQueryParam(org.springframework.web.util.UriBuilder builder, String name, String value) {
        if (StringUtils.hasText(value)) {
            builder.queryParam(name, value.trim());
        }
    }
}
