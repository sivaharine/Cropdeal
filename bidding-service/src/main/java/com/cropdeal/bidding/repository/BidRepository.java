package com.cropdeal.bidding.repository;

import com.cropdeal.bidding.entity.Bid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findBySessionIdOrderByBidTimeDesc(Long sessionId);
    List<Bid> findByDealerIdOrderByBidTimeDesc(Long dealerId);
}