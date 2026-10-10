package com.cropdeal.priceservice.config;

import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {
    private final GovernmentApiConfig config;

    public RestClientConfig(GovernmentApiConfig config) {
        this.config = config;
    }

    @Bean
    public RestClient governmentRestClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(30));
        factory.setReadTimeout(Duration.ofSeconds(120));

        return RestClient.builder()
                .baseUrl(config.getBaseUrl())
                .requestFactory(factory)
                .defaultHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                .defaultHeader("Accept", "application/json")
                .build();
    }
}
