package com.cropdeal.admin.client;

import com.cropdeal.admin.dto.client.DealerClientDto;
import com.cropdeal.admin.dto.client.DeliveryPartnerClientDto;
import com.cropdeal.admin.dto.client.FarmerClientDto;
import com.cropdeal.admin.dto.client.UserStatusUpdateClientRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@FeignClient(name = "user-service")
public interface UserServiceClient {

    @GetMapping("/api/admin/farmers")
    List<FarmerClientDto> getAllFarmers();

    @GetMapping("/api/admin/dealers")
    List<DealerClientDto> getAllDealers();

    @GetMapping("/api/admin/delivery-partners")
    List<DeliveryPartnerClientDto> getAllDeliveryPartners();

    @PutMapping("/api/admin/users/{userId}/status")
    void updateUserStatus(
            @PathVariable("userId") Long userId,
            @RequestBody UserStatusUpdateClientRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    );
}
