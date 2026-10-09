package com.cropdeal.pricealert.controller;

import com.cropdeal.pricealert.dto.BuyingRequestResponse;
import com.cropdeal.pricealert.dto.CreateBuyingRequest;
import com.cropdeal.pricealert.enums.BuyingRequestStatus;
import com.cropdeal.pricealert.service.DealerBuyingRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buying-requests")
@RequiredArgsConstructor
@Tag(name = "Dealer Buying Requests", description = "Endpoints for Dealers to post crop purchase requirements which trigger real-time farmer alerts")
public class DealerBuyingRequestController {

    private final DealerBuyingRequestService buyingRequestService;

    @PostMapping
    @Operation(summary = "Create buying request", description = "Dealers post what crop and price they want. Automatically alerts matching farmers in real-time.")
    public ResponseEntity<BuyingRequestResponse> createBuyingRequest(@Valid @RequestBody CreateBuyingRequest request) {
        BuyingRequestResponse response = buyingRequestService.createBuyingRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "Get all open buying requests", description = "Farmers and Dealers can browse currently active buyer requirements")
    public ResponseEntity<List<BuyingRequestResponse>> getAllOpenRequests() {
        return ResponseEntity.ok(buyingRequestService.getAllOpenRequests());
    }

    @GetMapping("/dealer/{dealerId}")
    @Operation(summary = "Get buying requests posted by a dealer")
    public ResponseEntity<List<BuyingRequestResponse>> getRequestsByDealer(@PathVariable Long dealerId) {
        return ResponseEntity.ok(buyingRequestService.getRequestsByDealer(dealerId));
    }

    @GetMapping("/crop/{cropName}")
    @Operation(summary = "Get buying requests by crop name")
    public ResponseEntity<List<BuyingRequestResponse>> getRequestsByCrop(@PathVariable String cropName) {
        return ResponseEntity.ok(buyingRequestService.getRequestsByCrop(cropName));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get buying request by ID")
    public ResponseEntity<BuyingRequestResponse> getRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(buyingRequestService.getRequestById(id));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update buying request status (OPEN, FULFILLED, CANCELLED)")
    public ResponseEntity<BuyingRequestResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam BuyingRequestStatus status) {
        return ResponseEntity.ok(buyingRequestService.updateStatus(id, status));
    }
}
