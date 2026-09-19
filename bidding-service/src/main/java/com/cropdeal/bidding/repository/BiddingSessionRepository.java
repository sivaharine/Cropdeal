package com.cropdeal.bidding.repository;

import com.cropdeal.bidding.entity.BiddingSession;
import com.cropdeal.bidding.entity.BiddingSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BiddingSessionRepository extends JpaRepository<BiddingSession, Long> {
    List<BiddingSession> findByStatusOrderByEndTimeAsc(BiddingSessionStatus status);
    List<BiddingSession> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
    List<BiddingSession> findByStatusAndEndTimeBefore(BiddingSessionStatus status, LocalDateTime now);
}