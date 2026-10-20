package com.cropdeal.user.controller;

import com.cropdeal.user.dto.CreateReviewRequest;
import com.cropdeal.user.dto.FarmerReviewResponse;
import com.cropdeal.user.service.FarmerReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class FarmerReviewController {

    private final FarmerReviewService reviewService;

    public FarmerReviewController(FarmerReviewService reviewService) {
        this.reviewService = reviewService;
    }

    // Dealer submits review for Farmer
    @PostMapping("/reviews")
    public ResponseEntity<FarmerReviewResponse> submitReview(@Valid @RequestBody CreateReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.submitReview(request));
    }

    // Public / Dealer view all reviews of a farmer
    @GetMapping("/reviews/farmer/{farmerId}")
    public ResponseEntity<List<FarmerReviewResponse>> getFarmerReviews(@PathVariable Long farmerId) {
        return ResponseEntity.ok(reviewService.getReviewsForFarmer(farmerId));
    }

    // Admin views all reviews
    @GetMapping("/admin/reviews")
    public ResponseEntity<List<FarmerReviewResponse>> getAllReviewsForAdmin() {
        return ResponseEntity.ok(reviewService.getAllReviewsForAdmin());
    }

    // Admin blocks a farmer
    @PostMapping("/admin/farmers/{farmerId}/block")
    public ResponseEntity<Map<String, Object>> blockFarmer(@PathVariable Long farmerId, @RequestParam(defaultValue = "Policy violation or low rating") String reason) {
        reviewService.blockFarmer(farmerId, reason);
        return ResponseEntity.ok(Map.of("message", "Farmer blocked successfully", "farmerId", farmerId, "status", "BLOCKED"));
    }

    // Admin unblocks a farmer
    @PostMapping("/admin/farmers/{farmerId}/unblock")
    public ResponseEntity<Map<String, Object>> unblockFarmer(@PathVariable Long farmerId) {
        reviewService.unblockFarmer(farmerId);
        return ResponseEntity.ok(Map.of("message", "Farmer unblocked successfully", "farmerId", farmerId, "status", "ACTIVE"));
    }
}