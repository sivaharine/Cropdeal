package com.cropdeal.user.repository;

import com.cropdeal.user.entity.FarmerReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FarmerReviewRepository extends JpaRepository<FarmerReview, Long> {
    List<FarmerReview> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
    Optional<FarmerReview> findByOrderId(Long orderId);
    boolean existsByOrderId(Long orderId);
}