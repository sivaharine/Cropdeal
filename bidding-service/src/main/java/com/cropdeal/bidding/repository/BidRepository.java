package com.cropdeal.bidding.repository;

import com.cropdeal.bidding.entity.Bid;
import com.cropdeal.bidding.entity.BidStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findByListingIdOrderByBidAmountDesc(Long listingId);
    List<Bid> findByDealerIdOrderByBidTimeDesc(Long dealerId);
    Optional<Bid> findFirstByListingIdAndStatusOrderByBidAmountDesc(Long listingId, BidStatus status);
}