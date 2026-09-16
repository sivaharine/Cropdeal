package com.cropdeal.user.controller;

import com.cropdeal.user.dto.DealerResponse;
import com.cropdeal.user.dto.DealerUpdateRequest;
import com.cropdeal.user.security.UserPrincipal;
import com.cropdeal.user.service.DealerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dealers")
public class DealerController {

    private final DealerService dealerService;

    public DealerController(DealerService dealerService) {
        this.dealerService = dealerService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('DEALER')")
    public ResponseEntity<DealerResponse> getMyProfile(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(
                dealerService.getDealerByUserId(principal.getUserId())
        );
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('DEALER')")
    public ResponseEntity<DealerResponse> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody DealerUpdateRequest request
    ) {
        return ResponseEntity.ok(
                dealerService.updateDealerByUserId(principal.getUserId(), request)
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DEALER', 'FARMER', 'ADMIN')")
    public ResponseEntity<DealerResponse> getDealerById(@PathVariable Long id) {
        return ResponseEntity.ok(dealerService.getDealerById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DEALER', 'ADMIN')")
    public ResponseEntity<DealerResponse> updateDealer(
            @PathVariable Long id,
            @Valid @RequestBody DealerUpdateRequest request
    ) {
        return ResponseEntity.ok(dealerService.updateDealer(id, request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DealerResponse>> getAllDealers() {
        return ResponseEntity.ok(dealerService.getAllDealers());
    }
}
