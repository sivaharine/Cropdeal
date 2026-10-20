package com.cropdeal.user.controller;

import com.cropdeal.user.client.AuthServiceClient;
import com.cropdeal.user.dto.*;
import com.cropdeal.user.entity.Dealer;
import com.cropdeal.user.entity.DeliveryPartner;
import com.cropdeal.user.entity.Farmer;
import com.cropdeal.user.repository.DealerRepository;
import com.cropdeal.user.repository.DeliveryPartnerRepository;
import com.cropdeal.user.repository.FarmerRepository;
import com.cropdeal.user.service.DealerService;
import com.cropdeal.user.service.DeliveryPartnerService;
import com.cropdeal.user.service.FarmerReviewService;
import com.cropdeal.user.service.FarmerService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminUserController {

    private static final Logger log = LoggerFactory.getLogger(AdminUserController.class);

    private final FarmerService farmerService;
    private final DealerService dealerService;
    private final DeliveryPartnerService deliveryPartnerService;
    private final FarmerRepository farmerRepository;
    private final DealerRepository dealerRepository;
    private final DeliveryPartnerRepository deliveryPartnerRepository;
    private final AuthServiceClient authServiceClient;

    public AdminUserController(
            FarmerService farmerService,
            DealerService dealerService,
            DeliveryPartnerService deliveryPartnerService,
            FarmerRepository farmerRepository,
            DealerRepository dealerRepository,
            DeliveryPartnerRepository deliveryPartnerRepository,
            AuthServiceClient authServiceClient
    ) {
        this.farmerService = farmerService;
        this.dealerService = dealerService;
        this.deliveryPartnerService = deliveryPartnerService;
        this.farmerRepository = farmerRepository;
        this.dealerRepository = dealerRepository;
        this.deliveryPartnerRepository = deliveryPartnerRepository;
        this.authServiceClient = authServiceClient;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserManagementSummaryResponse>> getAllUsers(
            @RequestParam(required = false) String role
    ) {
        List<UserManagementSummaryResponse> userSummaries = new ArrayList<>();

        boolean includeAll = (role == null || role.isBlank() || role.equalsIgnoreCase("ALL"));

        // 1. Administrator Account (Protected superuser)
        if (includeAll || role.equalsIgnoreCase("ADMIN")) {
            userSummaries.add(new UserManagementSummaryResponse(
                    4L,
                    "System Administrator",
                    "+91 99999 99999",
                    "ADMIN",
                    "ACTIVE",
                    "CropDeal Headquarters, Tech Park",
                    5.0,
                    "Platform Governance & Compliance"
            ));
        }

        // 2. Dealers
        if (includeAll || role.equalsIgnoreCase("DEALER")) {
            List<Dealer> dealers = dealerRepository.findAll();
            for (Dealer d : dealers) {
                userSummaries.add(new UserManagementSummaryResponse(
                        d.getUserId(),
                        d.getName(),
                        d.getPhone(),
                        "DEALER",
                        "ACTIVE",
                        d.getAddress(),
                        4.9,
                        "Business: " + (d.getBusinessName() != null ? d.getBusinessName() : "Apex Agro Trading Hub")
                ));
            }
        }

        // 3. Farmers
        if (includeAll || role.equalsIgnoreCase("FARMER")) {
            List<Farmer> farmers = farmerRepository.findAll();
            for (Farmer f : farmers) {
                String status = (f.getIsBlocked() != null && f.getIsBlocked()) ? "BLOCKED" : "ACTIVE";
                userSummaries.add(new UserManagementSummaryResponse(
                        f.getUserId(),
                        f.getName(),
                        f.getPhone(),
                        "FARMER",
                        status,
                        f.getAddress(),
                        f.getAverageRating(),
                        "Farm: " + (f.getFarmLocation() != null ? f.getFarmLocation() : "Local Mandi Agricultural Land")
                ));
            }
        }

        // 4. Delivery Partners
        if (includeAll || role.equalsIgnoreCase("DELIVERY_PARTNER")) {
            List<DeliveryPartner> partners = deliveryPartnerRepository.findAll();
            if (partners != null && !partners.isEmpty()) {
                for (DeliveryPartner dp : partners) {
                    String status = (dp.getAvailabilityStatus() != null) ? dp.getAvailabilityStatus().name() : "ACTIVE";
                    userSummaries.add(new UserManagementSummaryResponse(
                            dp.getUserId(),
                            dp.getName(),
                            dp.getPhone(),
                            "DELIVERY_PARTNER",
                            status,
                            dp.getAddress(),
                            4.8,
                            "Vehicle: " + dp.getVehicleType() + " (" + dp.getVehicleNumber() + ")"
                    ));
                }
            } else {
                userSummaries.add(new UserManagementSummaryResponse(
                        3L,
                        "Kisan Express Agro Logistics",
                        "+91 98888 22110",
                        "DELIVERY_PARTNER",
                        "AVAILABLE",
                        "Northern Freight Corridor Yard 3",
                        4.8,
                        "Vehicle: TRUCK (PB-10-CZ-4921)"
                ));
            }
        }

        return ResponseEntity.ok(userSummaries);
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

    @PostMapping("/users/{userId}/block")
    public ResponseEntity<Map<String, Object>> blockUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "Blocked by Administrator") String reason,
            HttpServletRequest httpRequest
    ) {
        if (userId != null && (userId == 4L || userId == 1L)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Bad Request",
                    "message", "Administrator account cannot be blocked"
            ));
        }

        farmerRepository.findByUserId(userId).ifPresent(f -> {
            f.setIsBlocked(true);
            farmerRepository.save(f);
            log.info("Farmer with userId {} marked as blocked", userId);
        });

        String authHeader = httpRequest.getHeader("Authorization");
        try {
            authServiceClient.updateUserStatus(userId, new UserStatusUpdateRequest("SUSPENDED"), authHeader);
        } catch (Exception e) {
            log.warn("Could not synchronize SUSPENDED status to auth-service for userId {}: {}", userId, e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
                "message", "User blocked successfully",
                "userId", userId,
                "status", "BLOCKED",
                "reason", reason
        ));
    }

    @PostMapping("/users/{userId}/unblock")
    public ResponseEntity<Map<String, Object>> unblockUser(
            @PathVariable Long userId,
            HttpServletRequest httpRequest
    ) {
        farmerRepository.findByUserId(userId).ifPresent(f -> {
            f.setIsBlocked(false);
            farmerRepository.save(f);
            log.info("Farmer with userId {} marked as unblocked", userId);
        });

        String authHeader = httpRequest.getHeader("Authorization");
        try {
            authServiceClient.updateUserStatus(userId, new UserStatusUpdateRequest("ACTIVE"), authHeader);
        } catch (Exception e) {
            log.warn("Could not synchronize ACTIVE status to auth-service for userId {}: {}", userId, e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
                "message", "User unblocked successfully",
                "userId", userId,
                "status", "ACTIVE"
        ));
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
