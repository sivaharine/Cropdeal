package com.cropdeal.review.service;

import com.cropdeal.review.client.OrderServiceClient;
import com.cropdeal.review.dto.*;
import com.cropdeal.review.entity.FarmerReview;
import com.cropdeal.review.entity.ReviewStatus;
import com.cropdeal.review.event.ReviewEventProducer;
import com.cropdeal.review.exception.DuplicateReviewException;
import com.cropdeal.review.exception.InvalidReviewException;
import com.cropdeal.review.exception.ResourceNotFoundException;
import com.cropdeal.review.exception.UnauthorizedReviewAccessException;
import com.cropdeal.review.repository.FarmerReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ReviewServiceImpl implements ReviewService {

    private final FarmerReviewRepository reviewRepository;
    private final OrderServiceClient orderServiceClient;
    private final ReviewEventProducer eventProducer;

    public ReviewServiceImpl(
            FarmerReviewRepository reviewRepository,
            OrderServiceClient orderServiceClient,
            ReviewEventProducer eventProducer) {
        this.reviewRepository = reviewRepository;
        this.orderServiceClient = orderServiceClient;
        this.eventProducer = eventProducer;
    }

    @Override
    @Transactional
    public FarmerReviewResponse createReview(FarmerReviewRequest request) {

        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new InvalidReviewException("Rating must be between 1 and 5");
        }

        // 1. Validate Order via OpenFeign
        try {
            OrderDto order = orderServiceClient.getOrderById(request.getOrderId());
            if (order != null) {
                if (!order.getDealerId().equals(request.getDealerId())) {
                    throw new InvalidReviewException("Dealer does not own this order");
                }
                if (!order.getFarmerId().equals(request.getFarmerId())) {
                    throw new InvalidReviewException("Farmer id does not match the order");
                }
            }
        } catch (InvalidReviewException ire) {
            throw ire;
        } catch (Exception e) {
            // Feign lookup warning
        }

        // 2. Prevent Duplicate Review for dealer + order
        if (reviewRepository.existsByDealerIdAndOrderIdAndStatusNot(
                request.getDealerId(), request.getOrderId(), ReviewStatus.DELETED)) {
            throw new DuplicateReviewException("A review has already been submitted for this order by the dealer.");
        }

        FarmerReview review = new FarmerReview();
        review.setReviewReference("REV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        review.setOrderId(request.getOrderId());
        review.setCropId(request.getCropId());
        review.setDealerId(request.getDealerId());
        review.setFarmerId(request.getFarmerId());
        review.setRating(request.getRating());
        review.setReviewText(request.getReviewText());
        review.setStatus(ReviewStatus.ACTIVE);

        FarmerReview saved = reviewRepository.save(review);

        eventProducer.publishReviewEvent("REVIEW_CREATED", saved.getId(), saved.getFarmerId(), saved.getOrderId(), saved.getRating());

        return mapToResponse(saved);
    }

    @Override
    public FarmerReviewResponse getReviewById(Long reviewId) {
        FarmerReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));
        return mapToResponse(review);
    }

    @Override
    public FarmerReviewResponse getReviewByReference(String reference) {
        FarmerReview review = reviewRepository.findByReviewReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with reference: " + reference));
        return mapToResponse(review);
    }

    @Override
    public FarmerRatingSummaryResponse getFarmerReviews(Long farmerId) {
        List<FarmerReview> reviews = reviewRepository.findByFarmerIdAndStatusNot(farmerId, ReviewStatus.DELETED);

        FarmerRatingSummaryResponse summary = new FarmerRatingSummaryResponse();
        summary.setFarmerId(farmerId);
        summary.setTotalReviews(reviews.size());

        if (reviews.isEmpty()) {
            summary.setAverageRating(0.0);
        } else {
            double avg = reviews.stream()
                    .mapToInt(FarmerReview::getRating)
                    .average()
                    .orElse(0.0);
            summary.setAverageRating(BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP).doubleValue());
        }

        summary.setReviews(reviews.stream().map(this::mapToResponse).collect(Collectors.toList()));
        return summary;
    }

    @Override
    public List<FarmerReviewResponse> getDealerReviews(Long dealerId) {
        return reviewRepository.findByDealerIdAndStatusNot(dealerId, ReviewStatus.DELETED)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<FarmerReviewResponse> getOrderReviews(Long orderId) {
        return reviewRepository.findByOrderId(orderId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<FarmerReviewResponse> getCropReviews(Long cropId) {
        return reviewRepository.findByCropIdAndStatusNot(cropId, ReviewStatus.DELETED)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FarmerReviewResponse updateReview(Long reviewId, UpdateReviewRequest request, Long requestingDealerId) {
        FarmerReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        if (requestingDealerId != null && !review.getDealerId().equals(requestingDealerId)) {
            throw new UnauthorizedReviewAccessException("Only the dealer who created this review can update it");
        }

        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new InvalidReviewException("Rating must be between 1 and 5");
        }

        review.setRating(request.getRating());
        review.setReviewText(request.getReviewText());
        review.setStatus(ReviewStatus.UPDATED);

        FarmerReview saved = reviewRepository.save(review);
        eventProducer.publishReviewEvent("REVIEW_UPDATED", saved.getId(), saved.getFarmerId(), saved.getOrderId(), saved.getRating());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteReview(Long reviewId, Long requestingDealerId, String userRole) {
        FarmerReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        boolean isAdmin = "ROLE_ADMIN".equalsIgnoreCase(userRole) || "ADMIN".equalsIgnoreCase(userRole);
        if (!isAdmin && requestingDealerId != null && !review.getDealerId().equals(requestingDealerId)) {
            throw new UnauthorizedReviewAccessException("Only the dealer who created this review or an admin can delete it");
        }

        review.setStatus(ReviewStatus.DELETED);
        reviewRepository.save(review);
        eventProducer.publishReviewEvent("REVIEW_DELETED", review.getId(), review.getFarmerId(), review.getOrderId(), review.getRating());
    }

    private FarmerReviewResponse mapToResponse(FarmerReview review) {
        FarmerReviewResponse r = new FarmerReviewResponse();
        r.setId(review.getId());
        r.setReviewReference(review.getReviewReference());
        r.setOrderId(review.getOrderId());
        r.setCropId(review.getCropId());
        r.setDealerId(review.getDealerId());
        r.setFarmerId(review.getFarmerId());
        r.setRating(review.getRating());
        r.setReviewText(review.getReviewText());
        r.setStatus(review.getStatus() != null ? review.getStatus().name() : null);
        r.setCreatedAt(review.getCreatedAt());
        r.setUpdatedAt(review.getUpdatedAt());
        return r;
    }
}