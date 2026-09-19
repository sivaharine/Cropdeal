package com.cropdeal.chatbotservice.config;

import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {
    private final SarvamConfig config;

    public RestClientConfig(SarvamConfig config) {
        this.config = config;
    }

    @Bean
    public RestClient sarvamRestClient() {
        return restClient(config.getBaseUrl());
    }

    @Bean
    public RestClient cropServiceRestClient(
            @Value("${cropdeal.services.crop-service-url:http://localhost:8087}") String baseUrl) {
        return restClient(baseUrl);
    }

    @Bean
    public RestClient priceServiceRestClient(
            @Value("${cropdeal.services.price-service-url:http://localhost:8083}") String baseUrl) {
        return restClient(baseUrl);
    }

    @Bean
    public RestClient orderServiceRestClient(
            @Value("${cropdeal.services.order-service-url:http://localhost:8085}") String baseUrl) {
        return restClient(baseUrl);
    }

    @Bean
    public RestClient deliveryServiceRestClient(
            @Value("${cropdeal.services.delivery-service-url:http://localhost:8090}") String baseUrl) {
        return restClient(baseUrl);
    }

    @Bean
    public RestClient authServiceRestClient(
            @Value("${cropdeal.services.auth-service-url:http://localhost:8081}") String baseUrl) {
        return restClient(baseUrl);
    }

    @Bean
    public RestClient userServiceRestClient(
            @Value("${cropdeal.services.user-service-url:http://localhost:8082}") String baseUrl) {
        return restClient(baseUrl);
    }

    private RestClient restClient(String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(15));

        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader("Accept", "application/json")
                .defaultHeader("Content-Type", "application/json")
                .build();
    }
}
