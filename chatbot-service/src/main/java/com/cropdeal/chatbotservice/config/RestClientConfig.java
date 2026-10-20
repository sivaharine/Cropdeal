package com.cropdeal.chatbotservice.config;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    private final SarvamConfig config;

    @Value("${cropdeal.services.auth-service-url:http://localhost:8081}")
    private String authServiceUrl;

    @Value("${cropdeal.services.user-service-url:http://localhost:8082}")
    private String userServiceUrl;

    @Value("${cropdeal.services.crop-service-url:http://localhost:8083}")
    private String cropServiceUrl;

    @Value("${cropdeal.price-service.url:http://localhost:8084}")
    private String priceServiceUrl;

    @Value("${cropdeal.services.order-service-url:http://localhost:8088}")
    private String orderServiceUrl;

    @Value("${cropdeal.services.delivery-service-url:http://localhost:8091}")
    private String deliveryServiceUrl;

    public RestClientConfig(SarvamConfig config) {
        this.config = config;
    }

    private SimpleClientHttpRequestFactory defaultFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(30));
        return factory;
    }

    @Bean
    public RestClient sarvamRestClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(30));
        factory.setReadTimeout(Duration.ofSeconds(120));

        String baseUrl = (config != null && config.getBaseUrl() != null && !config.getBaseUrl().isBlank())
                ? config.getBaseUrl()
                : "https://api.sarvam.ai";

        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader("Accept", "application/json")
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    @Bean
    public RestClient authServiceRestClient() {
        return RestClient.builder()
                .baseUrl(authServiceUrl)
                .requestFactory(defaultFactory())
                .defaultHeader("Accept", "application/json")
                .build();
    }

    @Bean
    public RestClient userServiceRestClient() {
        return RestClient.builder()
                .baseUrl(userServiceUrl)
                .requestFactory(defaultFactory())
                .defaultHeader("Accept", "application/json")
                .build();
    }

    @Bean
    public RestClient cropServiceRestClient() {
        return RestClient.builder()
                .baseUrl(cropServiceUrl)
                .requestFactory(defaultFactory())
                .defaultHeader("Accept", "application/json")
                .build();
    }

    @Bean
    public RestClient priceServiceRestClient() {
        return RestClient.builder()
                .baseUrl(priceServiceUrl)
                .requestFactory(defaultFactory())
                .defaultHeader("Accept", "application/json")
                .build();
    }

    @Bean
    public RestClient orderServiceRestClient() {
        return RestClient.builder()
                .baseUrl(orderServiceUrl)
                .requestFactory(defaultFactory())
                .defaultHeader("Accept", "application/json")
                .build();
    }

    @Bean
    public RestClient deliveryServiceRestClient() {
        return RestClient.builder()
                .baseUrl(deliveryServiceUrl)
                .requestFactory(defaultFactory())
                .defaultHeader("Accept", "application/json")
                .build();
    }
}
