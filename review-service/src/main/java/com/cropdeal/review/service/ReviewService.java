package com.cropdeal.review.service;

import com.cropdeal.review.dto.*;
import java.util.List;

public interface ReviewService {
    FarmerReviewResponse createReview(FarmerReviewRequest request);
    FarmerReviewResponse getReviewById(Long reviewId);
    FarmerReviewResponse getReviewByReference(String reference);
    FarmerRatingSummaryResponse getFarmerReviews(Long farmerId);
    List<FarmerReviewResponse> getDealerReviews(Long dealerId);
    List<FarmerReviewResponse> getOrderReviews(Long orderId);
    List<FarmerReviewResponse> getCropReviews(Long cropId);
    FarmerReviewResponse updateReview(Long reviewId, UpdateReviewRequest request, Long requestingDealerId);
    void deleteReview(Long reviewId, Long requestingDealerId, String userRole);
}