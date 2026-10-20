package com.cropdeal.user.controller;

import com.cropdeal.user.dto.FarmerResponse;
import com.cropdeal.user.dto.FarmerUpdateRequest;
import com.cropdeal.user.security.UserPrincipal;
import com.cropdeal.user.service.FarmerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/farmers")
public class FarmerController {

    private final FarmerService farmerService;

    public FarmerController(FarmerService farmerService) {
        this.farmerService = farmerService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<FarmerResponse> getMyProfile(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(
                farmerService.getFarmerByUserId(principal.getUserId())
        );
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<FarmerResponse> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody FarmerUpdateRequest request
    ) {
        return ResponseEntity.ok(
                farmerService.updateFarmerByUserId(principal.getUserId(), request)
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'DEALER', 'ADMIN')")
    public ResponseEntity<FarmerResponse> getFarmerById(@PathVariable Long id) {
        return ResponseEntity.ok(farmerService.getFarmerById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<FarmerResponse> updateFarmer(
            @PathVariable Long id,
            @Valid @RequestBody FarmerUpdateRequest request
    ) {
        return ResponseEntity.ok(farmerService.updateFarmer(id, request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FarmerResponse>> getAllFarmers() {
        return ResponseEntity.ok(farmerService.getAllFarmers());
    }
}
