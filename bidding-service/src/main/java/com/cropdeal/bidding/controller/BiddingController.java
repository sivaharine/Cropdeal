package com.cropdeal.bidding.controller;

import com.cropdeal.bidding.dto.*;
import com.cropdeal.bidding.service.BiddingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/biddings")
public class BiddingController {

    private final BiddingService biddingService;

    public BiddingController(BiddingService biddingService) {
        this.biddingService = biddingService;
    }

    @PostMapping
    public ResponseEntity<BiddingListingResponse> createListing(@Valid @RequestBody CreateBiddingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(biddingService.createListing(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BiddingListingResponse> getListing(@PathVariable Long id) {
        return ResponseEntity.ok(biddingService.getListing(id));
    }

    @GetMapping
    public ResponseEntity<List<BiddingListingResponse>> getOpenListings() {
        return ResponseEntity.ok(biddingService.getOpenListings());
    }

    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<List<BiddingListingResponse>> getFarmerListings(@PathVariable Long farmerId) {
        return ResponseEntity.ok(biddingService.getFarmerListings(farmerId));
    }

    @PostMapping("/{id}/bids")
    public ResponseEntity<BidResponse> placeBid(@PathVariable Long id, @Valid @RequestBody PlaceBidRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(biddingService.placeBid(id, request));
    }

    @GetMapping("/{id}/bids")
    public ResponseEntity<List<BidResponse>> getBidsForListing(@PathVariable Long id) {
        return ResponseEntity.ok(biddingService.getBidsForListing(id));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<BiddingListingResponse> closeBidding(@PathVariable Long id) {
        return ResponseEntity.ok(biddingService.closeBidding(id));
    }

    @PostMapping("/{id}/sell")
    public ResponseEntity<BiddingListingResponse> sellListing(@PathVariable Long id) {
        return ResponseEntity.ok(biddingService.sellListing(id));
    }

    @PostMapping(value = "/{id}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadPhoto(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        String url = biddingService.uploadPhoto(id, file);
        return ResponseEntity.ok(Map.of("photoUrl", url));
    }

    @GetMapping("/all")
    public ResponseEntity<List<BiddingListingResponse>> getAllListings() {
        return ResponseEntity.ok(biddingService.getAllListings());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteListing(@PathVariable Long id) {
        biddingService.deleteListing(id);
        return ResponseEntity.ok(Map.of("message", "Bidding listing deleted successfully", "id", id));
    }

    @PutMapping("/{id}/block")
    public ResponseEntity<BiddingListingResponse> toggleBlockListing(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean block
    ) {
        return ResponseEntity.ok(biddingService.toggleBlockListing(id, block));
    }
}