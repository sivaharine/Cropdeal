package com.cropdeal.user.service;

import com.cropdeal.user.dto.CreateReviewRequest;
import com.cropdeal.user.dto.FarmerReviewResponse;
import java.util.List;

public interface FarmerReviewService {
    FarmerReviewResponse submitReview(CreateReviewRequest request);
    List<FarmerReviewResponse> getReviewsForFarmer(Long farmerId);
    List<FarmerReviewResponse> getAllReviewsForAdmin();
    void blockFarmer(Long farmerId, String reason);
    void unblockFarmer(Long farmerId);
}