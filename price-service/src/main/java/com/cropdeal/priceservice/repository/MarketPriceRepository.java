package com.cropdeal.priceservice.repository;

import com.cropdeal.priceservice.entity.MarketPrice;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MarketPriceRepository extends JpaRepository<MarketPrice, Long> {

    Optional<MarketPrice> findByStateAndDistrictAndMarketAndCommodityAndVarietyAndGradeAndArrivalDate(
            String state,
            String district,
            String market,
            String commodity,
            String variety,
            String grade,
            LocalDate arrivalDate);

    @Query("""
            SELECT m
            FROM MarketPrice m
            WHERE (LOWER(TRIM(m.commodity)) = LOWER(TRIM(:commodity))
               OR LOWER(TRIM(m.commodity)) LIKE LOWER(CONCAT(TRIM(:commodity), ' (%'))
               OR LOWER(TRIM(m.commodity)) LIKE LOWER(CONCAT(TRIM(:commodity), '(%')))
              AND LOWER(REPLACE(TRIM(m.state), ' ', '')) = LOWER(REPLACE(TRIM(:state), ' ', ''))
              AND LOWER(REPLACE(TRIM(m.district), ' ', '')) = LOWER(REPLACE(TRIM(:district), ' ', ''))
            """)
    List<MarketPrice> findByCommodityStateAndDistrict(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("district") String district);

    @Query("""
            SELECT m
            FROM MarketPrice m
            WHERE (LOWER(TRIM(m.commodity)) = LOWER(TRIM(:commodity))
               OR LOWER(TRIM(m.commodity)) LIKE LOWER(CONCAT(TRIM(:commodity), ' (%'))
               OR LOWER(TRIM(m.commodity)) LIKE LOWER(CONCAT(TRIM(:commodity), '(%')))
              AND LOWER(REPLACE(TRIM(m.state), ' ', '')) = LOWER(REPLACE(TRIM(:state), ' ', ''))
            """)
    List<MarketPrice> findByCommodityAndState(
            @Param("commodity") String commodity,
            @Param("state") String state);

    @Query("""
            SELECT m
            FROM MarketPrice m
            WHERE (LOWER(TRIM(m.commodity)) = LOWER(TRIM(:commodity))
               OR LOWER(TRIM(m.commodity)) LIKE LOWER(CONCAT(TRIM(:commodity), ' (%'))
               OR LOWER(TRIM(m.commodity)) LIKE LOWER(CONCAT(TRIM(:commodity), '(%')))
              AND LOWER(REPLACE(TRIM(m.state), ' ', '')) = LOWER(REPLACE(TRIM(:state), ' ', ''))
              AND LOWER(REPLACE(TRIM(m.district), ' ', '')) = LOWER(REPLACE(TRIM(:district), ' ', ''))
              AND (LOWER(TRIM(m.grade)) = LOWER(TRIM(:grade))
               OR LOWER(TRIM(m.grade)) = LOWER(CONCAT('grade ', TRIM(:grade)))
               OR (LOWER(TRIM(:grade)) = 'a' AND LOWER(TRIM(m.grade)) IN ('faq', 'local', 'grade a', 'grade-a'))
               OR (LOWER(TRIM(:grade)) = 'b' AND LOWER(TRIM(m.grade)) IN ('medium', 'non-faq', 'grade b', 'grade-b'))
               OR (LOWER(TRIM(:grade)) = 'c' AND LOWER(TRIM(m.grade)) IN ('small', 'c', 'grade c', 'grade-c')))
            """)
    List<MarketPrice> findByCommodityStateDistrictAndGrade(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("district") String district,
            @Param("grade") String grade);

    @Query("""
            SELECT m
            FROM MarketPrice m
            WHERE (LOWER(TRIM(m.commodity)) = LOWER(TRIM(:commodity))
               OR LOWER(TRIM(m.commodity)) LIKE LOWER(CONCAT(TRIM(:commodity), ' (%'))
               OR LOWER(TRIM(m.commodity)) LIKE LOWER(CONCAT(TRIM(:commodity), '(%')))
              AND LOWER(REPLACE(TRIM(m.state), ' ', '')) = LOWER(REPLACE(TRIM(:state), ' ', ''))
              AND (LOWER(TRIM(m.grade)) = LOWER(TRIM(:grade))
               OR LOWER(TRIM(m.grade)) = LOWER(CONCAT('grade ', TRIM(:grade)))
               OR (LOWER(TRIM(:grade)) = 'a' AND LOWER(TRIM(m.grade)) IN ('faq', 'local', 'grade a', 'grade-a'))
               OR (LOWER(TRIM(:grade)) = 'b' AND LOWER(TRIM(m.grade)) IN ('medium', 'non-faq', 'grade b', 'grade-b'))
               OR (LOWER(TRIM(:grade)) = 'c' AND LOWER(TRIM(m.grade)) IN ('small', 'c', 'grade c', 'grade-c')))
            """)
    List<MarketPrice> findByCommodityStateAndGrade(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("grade") String grade);

    @Query("""
            SELECT m
            FROM MarketPrice m
            WHERE (LOWER(TRIM(m.commodity)) = LOWER(TRIM(:commodity))
               OR LOWER(TRIM(m.commodity)) LIKE LOWER(CONCAT(TRIM(:commodity), ' (%'))
               OR LOWER(TRIM(m.commodity)) LIKE LOWER(CONCAT(TRIM(:commodity), '(%')))
              AND (LOWER(TRIM(m.grade)) = LOWER(TRIM(:grade))
               OR LOWER(TRIM(m.grade)) = LOWER(CONCAT('grade ', TRIM(:grade)))
               OR (LOWER(TRIM(:grade)) = 'a' AND LOWER(TRIM(m.grade)) IN ('faq', 'local', 'grade a', 'grade-a'))
               OR (LOWER(TRIM(:grade)) = 'b' AND LOWER(TRIM(m.grade)) IN ('medium', 'non-faq', 'grade b', 'grade-b'))
               OR (LOWER(TRIM(:grade)) = 'c' AND LOWER(TRIM(m.grade)) IN ('small', 'c', 'grade c', 'grade-c')))
            """)
    List<MarketPrice> findByCommodityAndGrade(
            @Param("commodity") String commodity,
            @Param("grade") String grade);

    @Query("""
            SELECT m
            FROM MarketPrice m
            WHERE LOWER(TRIM(m.commodity)) = LOWER(TRIM(:commodity))
               OR LOWER(TRIM(m.commodity)) LIKE LOWER(CONCAT(TRIM(:commodity), ' (%'))
               OR LOWER(TRIM(m.commodity)) LIKE LOWER(CONCAT(TRIM(:commodity), '(%'))
            """)
    List<MarketPrice> findByCommodityNormalized(@Param("commodity") String commodity);
}
