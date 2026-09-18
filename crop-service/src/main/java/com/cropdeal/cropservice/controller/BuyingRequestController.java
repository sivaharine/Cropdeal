package com.cropdeal.cropservice.controller;

import com.cropdeal.cropservice.dto.BuyingRequestCreateDto;
import com.cropdeal.cropservice.dto.BuyingRequestResponseDto;
import com.cropdeal.cropservice.service.BuyingRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/crops/buying-requests")
@Tag(name = "Dealer Buying Requests API", description = "Endpoints for dealers to post buying requests and trigger farmer price alerts")
public class BuyingRequestController {

    private final BuyingRequestService buyingRequestService;

    public BuyingRequestController(BuyingRequestService buyingRequestService) {
        this.buyingRequestService = buyingRequestService;
    }

    @PostMapping
    @Operation(summary = "Create a dealer buying request and trigger real-time farmer price alerts")
    public ResponseEntity<BuyingRequestResponseDto> createBuyingRequest(
            @Valid @RequestBody BuyingRequestCreateDto dto,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return new ResponseEntity<>(buyingRequestService.createBuyingRequest(dto, userId), HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "Get all active dealer buying requests")
    public ResponseEntity<List<BuyingRequestResponseDto>> getActiveRequests() {
        return ResponseEntity.ok(buyingRequestService.getActiveBuyingRequests());
    }

    @GetMapping("/dealer/{dealerId}")
    @Operation(summary = "Get buying requests for a specific dealer")
    public ResponseEntity<List<BuyingRequestResponseDto>> getByDealer(@PathVariable Long dealerId) {
        return ResponseEntity.ok(buyingRequestService.getByDealerId(dealerId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single buying request by ID")
    public ResponseEntity<BuyingRequestResponseDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(buyingRequestService.getById(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Cancel a buying request")
    public ResponseEntity<Void> cancelRequest(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        buyingRequestService.cancelBuyingRequest(id, userId);
        return ResponseEntity.noContent().build();
    }
}