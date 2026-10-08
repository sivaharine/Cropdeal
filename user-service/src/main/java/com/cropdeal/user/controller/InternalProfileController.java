package com.cropdeal.user.controller;

import com.cropdeal.user.dto.CreateProfileRequest;
import com.cropdeal.user.enums.Role;
import com.cropdeal.user.service.DealerService;
import com.cropdeal.user.service.DeliveryPartnerService;
import com.cropdeal.user.service.FarmerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/internal")
public class InternalProfileController {

    private final FarmerService farmerService;
    private final DealerService dealerService;
    private final DeliveryPartnerService deliveryPartnerService;

    public InternalProfileController(
            FarmerService farmerService,
            DealerService dealerService,
            DeliveryPartnerService deliveryPartnerService
    ) {
        this.farmerService = farmerService;
        this.dealerService = dealerService;
        this.deliveryPartnerService = deliveryPartnerService;
    }

    @PostMapping("/profile")
    public ResponseEntity<Void> createProfile(@Valid @RequestBody CreateProfileRequest request) {
        if (request.getRole() == Role.FARMER) {
            farmerService.createFarmerProfile(request.getUserId(), request.getName(), request.getPhone());
        } else if (request.getRole() == Role.DEALER) {
            dealerService.createDealerProfile(request.getUserId(), request.getName(), request.getPhone());
        } else if (request.getRole() == Role.DELIVERY_PARTNER) {
            deliveryPartnerService.createDeliveryPartnerProfile(request.getUserId(), request.getName(), request.getPhone());
        }

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/profile/{userId}")
    public ResponseEntity<Void> deleteProfile(@PathVariable Long userId) {
        farmerService.deleteFarmerByUserId(userId);
        dealerService.deleteDealerByUserId(userId);
        deliveryPartnerService.deleteDeliveryPartnerByUserId(userId);
        return ResponseEntity.noContent().build();
    }
}
