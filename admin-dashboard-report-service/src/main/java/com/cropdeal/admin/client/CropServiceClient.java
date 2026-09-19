package com.cropdeal.admin.client;

import com.cropdeal.admin.dto.client.CropClientDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@FeignClient(name = "crop-service")
public interface CropServiceClient {

    @GetMapping("/api/crops/search")
    List<CropClientDto> searchCrops();

    @GetMapping("/api/crops/{id}")
    CropClientDto getCropById(@PathVariable("id") Long id);

    @DeleteMapping("/api/crops/{id}")
    void deleteCrop(@PathVariable("id") Long id);
}
