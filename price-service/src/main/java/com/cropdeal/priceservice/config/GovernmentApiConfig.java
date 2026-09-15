package com.cropdeal.priceservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "government.api")
public class GovernmentApiConfig {

    private String baseUrl;

    private String resourceId;

    private String key;

    private String format;


    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }


    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }


    public String getApiKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }


    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }
}