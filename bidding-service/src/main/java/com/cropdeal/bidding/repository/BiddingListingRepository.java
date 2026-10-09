package com.cropdeal.bidding.repository;

import com.cropdeal.bidding.entity.BiddingListing;
import com.cropdeal.bidding.entity.BiddingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BiddingListingRepository extends JpaRepository<BiddingListing, Long> {
    List<BiddingListing> findByStatusOrderByCreatedAtDesc(BiddingStatus status);
    List<BiddingListing> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
}