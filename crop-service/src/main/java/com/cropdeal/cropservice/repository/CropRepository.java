package com.cropdeal.cropservice.repository;

import com.cropdeal.cropservice.entity.Crop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface CropRepository extends JpaRepository<Crop, Long> {
    List<Crop> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);

    @Query("""
        SELECT c FROM Crop c
        WHERE c.status = 'PUBLISHED'
          AND c.quantity > 0
          AND (:commodity IS NULL OR LOWER(TRIM(c.commodity)) LIKE LOWER(CONCAT('%', :commodity, '%')))
          AND (:state IS NULL OR LOWER(TRIM(c.state)) = LOWER(TRIM(:state)))
          AND (:district IS NULL OR LOWER(TRIM(c.district)) = LOWER(TRIM(:district)))
          AND (:grade IS NULL OR LOWER(TRIM(c.grade)) = LOWER(TRIM(:grade)))
        ORDER BY c.createdAt DESC
        """)
    List<Crop> searchAvailable(@Param("commodity") String commodity,
                               @Param("state") String state,
                               @Param("district") String district,
                               @Param("grade") String grade);

    @Query("""
        SELECT c FROM Crop c
        WHERE c.status = 'PUBLISHED'
          AND c.quantity > 0
          AND (:state IS NULL OR LOWER(TRIM(c.state)) = LOWER(TRIM(:state)))
          AND (:district IS NULL OR LOWER(TRIM(c.district)) = LOWER(TRIM(:district)))
          AND (:commodity IS NULL OR LOWER(TRIM(c.commodity)) LIKE LOWER(CONCAT('%', :commodity, '%')))
          AND (:grade IS NULL OR LOWER(TRIM(c.grade)) = LOWER(TRIM(:grade)))
        ORDER BY
          CASE
            WHEN :district IS NOT NULL AND LOWER(TRIM(c.district)) = LOWER(TRIM(:district)) THEN 0
            WHEN :state IS NOT NULL AND LOWER(TRIM(c.state)) = LOWER(TRIM(:state)) THEN 1
            ELSE 2
          END,
          c.createdAt DESC
        """)
    List<Crop> searchNearbyProducts(@Param("state") String state,
                                    @Param("district") String district,
                                    @Param("commodity") String commodity,
                                    @Param("grade") String grade);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE Crop c
           SET c.quantity = c.quantity - :purchasedQuantity,
               c.status = CASE WHEN c.quantity = :purchasedQuantity THEN 'SOLD_OUT' ELSE 'PUBLISHED' END,
               c.updatedAt = CURRENT_TIMESTAMP
         WHERE c.id = :cropId
           AND c.status = 'PUBLISHED'
           AND c.quantity >= :purchasedQuantity
        """)
    int reduceQuantity(@Param("cropId") Long cropId,
                       @Param("purchasedQuantity") BigDecimal purchasedQuantity);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE Crop c
           SET c.quantity = c.quantity + :restoredQuantity,
               c.status = 'PUBLISHED',
               c.updatedAt = CURRENT_TIMESTAMP
         WHERE c.id = :cropId
        """)
    int restoreQuantity(@Param("cropId") Long cropId,
                        @Param("restoredQuantity") BigDecimal restoredQuantity);
}
