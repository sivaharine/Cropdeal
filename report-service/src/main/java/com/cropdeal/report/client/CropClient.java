package com.cropdeal.report.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.Map;

@FeignClient(name = "crop-service", url = "${crop-service.url:http://localhost:8083}")
public interface CropClient {

    @GetMapping("/api/crops/search")
    List<Map<String, Object>> searchCrops();
}
