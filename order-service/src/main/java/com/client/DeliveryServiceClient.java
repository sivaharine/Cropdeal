package com.client;

import com.config.FeignConfig;
import com.dto.DeliveryAssignmentRequest;
import com.dto.DeliveryResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(
        name = "delivery-service",
        configuration = FeignConfig.class
)
public interface DeliveryServiceClient {

    @PostMapping("/api/deliveries")
    DeliveryResponse createDelivery(@RequestBody DeliveryAssignmentRequest request);

    @GetMapping("/api/deliveries/order/{orderId}")
    DeliveryResponse getDeliveryByOrderId(@PathVariable Long orderId);

    @DeleteMapping("/api/deliveries/{deliveryId}")
    void cancelDelivery(@PathVariable Long deliveryId);
}
