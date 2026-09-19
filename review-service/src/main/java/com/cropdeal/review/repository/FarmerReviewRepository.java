package com.cropdeal.review.repository;

import com.cropdeal.review.entity.FarmerReview;
import com.cropdeal.review.entity.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FarmerReviewRepository extends JpaRepository<FarmerReview, Long> {
    Optional<FarmerReview> findByReviewReference(String reviewReference);
    Optional<FarmerReview> findByDealerIdAndOrderId(Long dealerId, Long orderId);
    boolean existsByDealerIdAndOrderIdAndStatusNot(Long dealerId, Long orderId, ReviewStatus status);
    List<FarmerReview> findByFarmerIdAndStatusNot(Long farmerId, ReviewStatus status);
    List<FarmerReview> findByDealerIdAndStatusNot(Long dealerId, ReviewStatus status);
    List<FarmerReview> findByOrderId(Long orderId);
    List<FarmerReview> findByCropIdAndStatusNot(Long cropId, ReviewStatus status);
}