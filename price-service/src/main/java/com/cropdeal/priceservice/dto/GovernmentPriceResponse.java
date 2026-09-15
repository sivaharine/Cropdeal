package com.cropdeal.priceservice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class GovernmentPriceResponse {
    private String message;
    private Integer total;
    private List<Map<String, Object>> records;

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Integer getTotal() { return total; }
    public void setTotal(Integer total) { this.total = total; }
    public List<Map<String, Object>> getRecords() { return records; }
    public void setRecords(List<Map<String, Object>> records) { this.records = records; }
}

