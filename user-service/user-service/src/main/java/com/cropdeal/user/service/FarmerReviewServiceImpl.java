package com.cropdeal.user.service;

import com.cropdeal.user.dto.CreateReviewRequest;
import com.cropdeal.user.dto.FarmerReviewResponse;
import com.cropdeal.user.entity.Farmer;
import com.cropdeal.user.entity.FarmerReview;
import com.cropdeal.user.exception.FarmerNotFoundException;
import com.cropdeal.user.repository.FarmerRepository;
import com.cropdeal.user.repository.FarmerReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class FarmerReviewServiceImpl implements FarmerReviewService {

    private final FarmerReviewRepository reviewRepository;
    private final FarmerRepository farmerRepository;

    public FarmerReviewServiceImpl(FarmerReviewRepository reviewRepository,
                                   FarmerRepository farmerRepository) {
        this.reviewRepository = reviewRepository;
        this.farmerRepository = farmerRepository;
    }

    @Override
    public FarmerReviewResponse submitReview(CreateReviewRequest request) {
        if (reviewRepository.existsByOrderId(request.orderId())) {
            throw new IllegalArgumentException("Order " + request.orderId() + " has already been reviewed.");
        }

        Farmer farmer = farmerRepository.findById(request.farmerId())
                .orElseThrow(() -> new FarmerNotFoundException(request.farmerId()));

        FarmerReview review = new FarmerReview();
        review.setFarmerId(request.farmerId());
        review.setDealerId(request.dealerId());
        review.setOrderId(request.orderId());
        review.setRating(request.rating());
        review.setComment(request.comment());

        FarmerReview savedReview = reviewRepository.save(review);

        // Recalculate average rating for farmer
        List<FarmerReview> allReviews = reviewRepository.findByFarmerIdOrderByCreatedAtDesc(farmer.getId());
        double avg = allReviews.stream().mapToInt(FarmerReview::getRating).average().orElse(0.0);
        farmer.setAverageRating(Math.round(avg * 10.0) / 10.0);
        farmer.setTotalReviews(allReviews.size());
        farmerRepository.save(farmer);

        return toResponse(savedReview);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FarmerReviewResponse> getReviewsForFarmer(Long farmerId) {
        return reviewRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FarmerReviewResponse> getAllReviewsForAdmin() {
        return reviewRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public void blockFarmer(Long farmerId, String reason) {
        Farmer farmer = farmerRepository.findById(farmerId)
                .orElseThrow(() -> new FarmerNotFoundException(farmerId));
        farmer.setIsBlocked(true);
        farmerRepository.save(farmer);
    }

    @Override
    public void unblockFarmer(Long farmerId) {
        Farmer farmer = farmerRepository.findById(farmerId)
                .orElseThrow(() -> new FarmerNotFoundException(farmerId));
        farmer.setIsBlocked(false);
        farmerRepository.save(farmer);
    }

    private FarmerReviewResponse toResponse(FarmerReview r) {
        return new FarmerReviewResponse(
                r.getId(),
                r.getFarmerId(),
                r.getDealerId(),
                r.getOrderId(),
                r.getRating(),
                r.getComment(),
                r.getCreatedAt()
        );
    }
}