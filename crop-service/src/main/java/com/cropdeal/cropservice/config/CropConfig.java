package com.cropdeal.cropservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "crop-service")
public class CropConfig {
    private String priceServiceUrl;

    public String getPriceServiceUrl() {
        return priceServiceUrl;
    }

    public void setPriceServiceUrl(String priceServiceUrl) {
        this.priceServiceUrl = priceServiceUrl;
    }
}
