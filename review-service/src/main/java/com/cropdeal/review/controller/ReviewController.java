package com.cropdeal.review.controller;

import com.cropdeal.review.dto.*;
import com.cropdeal.review.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/farmers")
    public ResponseEntity<FarmerReviewResponse> createReview(
            @Valid @RequestBody FarmerReviewRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(reviewService.createReview(request));
    }

    @GetMapping("/{reviewId}")
    public ResponseEntity<FarmerReviewResponse> getReviewById(
            @PathVariable Long reviewId) {
        return ResponseEntity.ok(reviewService.getReviewById(reviewId));
    }

    @GetMapping("/reference/{reviewReference}")
    public ResponseEntity<FarmerReviewResponse> getReviewByReference(
            @PathVariable String reviewReference) {
        return ResponseEntity.ok(reviewService.getReviewByReference(reviewReference));
    }

    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<FarmerRatingSummaryResponse> getFarmerReviews(
            @PathVariable Long farmerId) {
        return ResponseEntity.ok(reviewService.getFarmerReviews(farmerId));
    }

    @GetMapping("/dealer/{dealerId}")
    public ResponseEntity<List<FarmerReviewResponse>> getDealerReviews(
            @PathVariable Long dealerId) {
        return ResponseEntity.ok(reviewService.getDealerReviews(dealerId));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<FarmerReviewResponse>> getOrderReviews(
            @PathVariable Long orderId) {
        return ResponseEntity.ok(reviewService.getOrderReviews(orderId));
    }

    @GetMapping("/crop/{cropId}")
    public ResponseEntity<List<FarmerReviewResponse>> getCropReviews(
            @PathVariable Long cropId) {
        return ResponseEntity.ok(reviewService.getCropReviews(cropId));
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<FarmerReviewResponse> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody UpdateReviewRequest request,
            @RequestParam(required = false) Long dealerId) {
        return ResponseEntity.ok(reviewService.updateReview(reviewId, request, dealerId));
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId,
            @RequestParam(required = false) Long dealerId,
            @RequestParam(required = false, defaultValue = "ROLE_DEALER") String role) {
        reviewService.deleteReview(reviewId, dealerId, role);
        return ResponseEntity.noContent().build();
    }
}