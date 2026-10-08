package com.client;

import com.config.FeignConfig;
import com.dto.CropResponse;
import com.dto.QuantityUpdateRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(
        name = "crop-service",
        configuration = FeignConfig.class
)
public interface CropServiceClient {

    @PatchMapping("/api/crops/{id}/quantity")
    CropResponse reduceQuantity(
            @PathVariable Long id,
            @RequestBody QuantityUpdateRequest request);

    @PatchMapping("/api/crops/{id}/quantity/restore")
    CropResponse restoreQuantity(
            @PathVariable Long id,
            @RequestBody QuantityUpdateRequest request);
}
