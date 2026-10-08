package com.cropdeal.pricealert.repository;

import com.cropdeal.pricealert.entity.PriceAlertSubscription;
import com.cropdeal.pricealert.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PriceAlertSubscriptionRepository extends JpaRepository<PriceAlertSubscription, Long> {

    List<PriceAlertSubscription> findByUserId(Long userId);

    List<PriceAlertSubscription> findByUserIdAndActiveTrue(Long userId);

    List<PriceAlertSubscription> findByCropNameIgnoreCaseAndActiveTrue(String cropName);

    List<PriceAlertSubscription> findByCropNameIgnoreCaseAndUserRoleAndActiveTrue(String cropName, UserRole userRole);

    @Query("SELECT s FROM PriceAlertSubscription s WHERE LOWER(s.cropName) = LOWER(:cropName) AND s.active = true AND (:district IS NULL OR s.district IS NULL OR LOWER(s.district) = LOWER(:district))")
    List<PriceAlertSubscription> findActiveMatchingSubscriptions(
            @Param("cropName") String cropName,
            @Param("district") String district);

    @Query("SELECT s FROM PriceAlertSubscription s WHERE LOWER(s.cropName) = LOWER(:cropName) AND s.userRole = :userRole AND s.active = true AND (:district IS NULL OR s.district IS NULL OR LOWER(s.district) = LOWER(:district))")
    List<PriceAlertSubscription> findActiveMatchingSubscriptionsByRole(
            @Param("cropName") String cropName,
            @Param("userRole") UserRole userRole,
            @Param("district") String district);
}
