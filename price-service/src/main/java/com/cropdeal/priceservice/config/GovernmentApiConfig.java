package com.cropdeal.priceservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "government.api")
public class GovernmentApiConfig {
    private String baseUrl;
    private String resourceId;
    private String key;
    private String format = "json";
    private int pageSize = 1000;
    private String syncCron = "0 0 2 * * *";

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }
    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }
    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }
    public String getSyncCron() { return syncCron; }
    public void setSyncCron(String syncCron) { this.syncCron = syncCron; }
}
