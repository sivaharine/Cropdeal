package com.cropdeal.user.controller;

import com.cropdeal.user.dto.DeliveryPartnerResponse;
import com.cropdeal.user.dto.DeliveryPartnerUpdateRequest;
import com.cropdeal.user.security.UserPrincipal;
import com.cropdeal.user.service.DeliveryPartnerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery-partners")
public class DeliveryPartnerController {

    private final DeliveryPartnerService deliveryPartnerService;

    public DeliveryPartnerController(DeliveryPartnerService deliveryPartnerService) {
        this.deliveryPartnerService = deliveryPartnerService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('DELIVERY_PARTNER')")
    public ResponseEntity<DeliveryPartnerResponse> getMyProfile(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(
                deliveryPartnerService.getDeliveryPartnerByUserId(principal.getUserId())
        );
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('DELIVERY_PARTNER')")
    public ResponseEntity<DeliveryPartnerResponse> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody DeliveryPartnerUpdateRequest request
    ) {
        return ResponseEntity.ok(
                deliveryPartnerService.updateDeliveryPartnerByUserId(principal.getUserId(), request)
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DELIVERY_PARTNER', 'ADMIN')")
    public ResponseEntity<DeliveryPartnerResponse> getDeliveryPartnerById(@PathVariable Long id) {
        return ResponseEntity.ok(deliveryPartnerService.getDeliveryPartnerById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DELIVERY_PARTNER', 'ADMIN')")
    public ResponseEntity<DeliveryPartnerResponse> updateDeliveryPartner(
            @PathVariable Long id,
            @Valid @RequestBody DeliveryPartnerUpdateRequest request
    ) {
        return ResponseEntity.ok(deliveryPartnerService.updateDeliveryPartner(id, request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DeliveryPartnerResponse>> getAllDeliveryPartners() {
        return ResponseEntity.ok(deliveryPartnerService.getAllDeliveryPartners());
    }
}
