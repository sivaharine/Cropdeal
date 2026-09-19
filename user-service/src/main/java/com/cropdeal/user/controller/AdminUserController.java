package com.cropdeal.user.controller;

import com.cropdeal.user.client.AuthServiceClient;
import com.cropdeal.user.dto.*;
import com.cropdeal.user.service.DealerService;
import com.cropdeal.user.service.DeliveryPartnerService;
import com.cropdeal.user.service.FarmerService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final FarmerService farmerService;
    private final DealerService dealerService;
    private final DeliveryPartnerService deliveryPartnerService;
    private final AuthServiceClient authServiceClient;

    public AdminUserController(
            FarmerService farmerService,
            DealerService dealerService,
            DeliveryPartnerService deliveryPartnerService,
            AuthServiceClient authServiceClient
    ) {
        this.farmerService = farmerService;
        this.dealerService = dealerService;
        this.deliveryPartnerService = deliveryPartnerService;
        this.authServiceClient = authServiceClient;
    }

    @GetMapping("/farmers")
    public ResponseEntity<List<FarmerResponse>> getAllFarmers() {
        return ResponseEntity.ok(farmerService.getAllFarmers());
    }

    @GetMapping("/dealers")
    public ResponseEntity<List<DealerResponse>> getAllDealers() {
        return ResponseEntity.ok(dealerService.getAllDealers());
    }

    @GetMapping("/delivery-partners")
    public ResponseEntity<List<DeliveryPartnerResponse>> getAllDeliveryPartners() {
        return ResponseEntity.ok(deliveryPartnerService.getAllDeliveryPartners());
    }

    @PutMapping("/users/{userId}/status")
    public ResponseEntity<MessageResponse> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody UserStatusUpdateRequest request,
            HttpServletRequest httpRequest
    ) {
        String authHeader = httpRequest.getHeader("Authorization");
        return authServiceClient.updateUserStatus(userId, request, authHeader);
    }
}
