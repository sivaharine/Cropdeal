package com.cropdeal.bidding.controller;

import com.cropdeal.bidding.dto.*;
import com.cropdeal.bidding.security.JwtService;
import com.cropdeal.bidding.service.BiddingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bidding")
@Tag(name = "Bidding & Auction API", description = "Endpoints for crop auctions, wallet-funded dealer bidding, and deal finalization")
public class BiddingController {

    private final BiddingService biddingService;
    private final JwtService jwtService;

    public BiddingController(BiddingService biddingService, JwtService jwtService) {
        this.biddingService = biddingService;
        this.jwtService = jwtService;
    }

    @PostMapping("/sessions")
    @Operation(summary = "Farmer creates a crop auction/bidding session")
    public ResponseEntity<BiddingSessionResponse> createSession(
            @Valid @RequestBody CreateBiddingSessionRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestHeader(value = "X-User-Role", required = false) String headerUserRole) {

        Long userId = resolveUserId(authHeader, headerUserId);
        String userRole = resolveUserRole(authHeader, headerUserRole, "FARMER");
        return new ResponseEntity<>(biddingService.createSession(request, userId, userRole), HttpStatus.CREATED);
    }

    @GetMapping("/sessions/active")
    @Operation(summary = "Get all active live crop auctions")
    public ResponseEntity<List<BiddingSessionResponse>> getActiveSessions() {
        return ResponseEntity.ok(biddingService.getActiveSessions());
    }

    @GetMapping("/sessions/{id}")
    @Operation(summary = "Get bidding session details and current highest bid")
    public ResponseEntity<BiddingSessionResponse> getSessionById(@PathVariable Long id) {
        return ResponseEntity.ok(biddingService.getSessionById(id));
    }

    @GetMapping("/sessions/farmer/{farmerId}")
    @Operation(summary = "Get all bidding sessions created by a farmer")
    public ResponseEntity<List<BiddingSessionResponse>> getSessionsByFarmer(@PathVariable Long farmerId) {
        return ResponseEntity.ok(biddingService.getSessionsByFarmer(farmerId));
    }

    @PostMapping("/sessions/{id}/bids")
    @Operation(summary = "Dealer places a bid funded exclusively through their CropDeal wallet")
    public ResponseEntity<BidResponse> placeBid(
            @PathVariable Long id,
            @Valid @RequestBody PlaceBidRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestHeader(value = "X-User-Role", required = false) String headerUserRole) {

        Long userId = resolveUserId(authHeader, headerUserId);
        String userRole = resolveUserRole(authHeader, headerUserRole, "DEALER");
        return new ResponseEntity<>(biddingService.placeBid(id, request, userId, userRole), HttpStatus.CREATED);
    }

    @GetMapping("/sessions/{id}/bids")
    @Operation(summary = "Get all bids placed for an auction session (bid history)")
    public ResponseEntity<List<BidResponse>> getBidsForSession(@PathVariable Long id) {
        return ResponseEntity.ok(biddingService.getBidsForSession(id));
    }

    @GetMapping("/bids/dealer/{dealerId}")
    @Operation(summary = "Get all bids placed by a specific dealer")
    public ResponseEntity<List<BidResponse>> getBidsByDealer(@PathVariable Long dealerId) {
        return ResponseEntity.ok(biddingService.getBidsByDealer(dealerId));
    }

    @PostMapping("/sessions/{id}/close")
    @Operation(summary = "Farmer closes and awards the auction to the highest bidder, settling payout to farmer wallet")
    public ResponseEntity<BiddingSessionResponse> closeSession(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestHeader(value = "X-User-Role", required = false) String headerUserRole) {

        Long userId = resolveUserId(authHeader, headerUserId);
        String userRole = resolveUserRole(authHeader, headerUserRole, "FARMER");
        return ResponseEntity.ok(biddingService.closeSession(id, userId, userRole));
    }

    @DeleteMapping("/sessions/{id}")
    @Operation(summary = "Farmer cancels an auction session and refunds any held bidder funds")
    public ResponseEntity<Void> cancelSession(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestHeader(value = "X-User-Role", required = false) String headerUserRole) {

        Long userId = resolveUserId(authHeader, headerUserId);
        String userRole = resolveUserRole(authHeader, headerUserRole, "FARMER");
        biddingService.cancelSession(id, userId, userRole);
        return ResponseEntity.noContent().build();
    }

    private Long resolveUserId(String authHeader, Long headerUserId) {
        if (headerUserId != null) return headerUserId;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtService.extractUserId(authHeader.substring(7));
        }
        return 1L;
    }

    private String resolveUserRole(String authHeader, String headerUserRole, String defaultRole) {
        if (headerUserRole != null) return headerUserRole;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtService.extractRole(authHeader.substring(7));
        }
        return defaultRole;
    }
}