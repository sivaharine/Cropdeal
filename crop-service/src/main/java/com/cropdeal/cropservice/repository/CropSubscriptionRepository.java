package com.cropdeal.cropservice.repository;

import com.cropdeal.cropservice.entity.CropSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CropSubscriptionRepository extends JpaRepository<CropSubscription, Long> {

    @Query("""
        SELECT s FROM CropSubscription s
        WHERE LOWER(TRIM(s.commodity)) = LOWER(TRIM(:commodity))
          AND ((:state IS NULL AND s.state IS NULL) OR LOWER(TRIM(s.state)) = LOWER(TRIM(:state)))
          AND ((:district IS NULL AND s.district IS NULL) OR LOWER(TRIM(s.district)) = LOWER(TRIM(:district)))
          AND ((:grade IS NULL AND s.grade IS NULL) OR LOWER(TRIM(s.grade)) = LOWER(TRIM(:grade)))
        """)
    List<CropSubscription> findExactSubscription(@Param("commodity") String commodity,
                                                  @Param("state") String state,
                                                  @Param("district") String district,
                                                  @Param("grade") String grade);

    List<CropSubscription> findBySubscriberIdOrderBySubscribedAtDesc(Long subscriberId);

    @Query("""
        SELECT s FROM CropSubscription s
        WHERE LOWER(TRIM(s.commodity)) = LOWER(TRIM(:commodity))
          AND (s.state IS NULL OR LOWER(TRIM(s.state)) = LOWER(TRIM(:state)))
          AND (s.district IS NULL OR LOWER(TRIM(s.district)) = LOWER(TRIM(:district)))
          AND (s.grade IS NULL OR LOWER(TRIM(s.grade)) = LOWER(TRIM(:grade)))
        ORDER BY s.subscribedAt DESC
        """)
    List<CropSubscription> findMatchingSubscriptions(@Param("commodity") String commodity,
                                                      @Param("state") String state,
                                                      @Param("district") String district,
                                                      @Param("grade") String grade);
}
