package com.cropdeal.bidding.query;

import com.cropdeal.bidding.dto.BidResponse;
import com.cropdeal.bidding.dto.BiddingListingResponse;
import com.cropdeal.bidding.entity.Bid;
import com.cropdeal.bidding.entity.BiddingListing;
import com.cropdeal.bidding.entity.BiddingStatus;
import com.cropdeal.bidding.exception.BiddingNotFoundException;
import com.cropdeal.bidding.repository.BidRepository;
import com.cropdeal.bidding.repository.BiddingListingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * CQRS Query Service for Bidding reads (getListing, getOpenListings, getFarmerListings, getBids, getAllListings).
 */
@Service
@Transactional(readOnly = true)
public class BiddingQueryService {

    private final BiddingListingRepository listingRepository;
    private final BidRepository bidRepository;

    public BiddingQueryService(BiddingListingRepository listingRepository,
                               BidRepository bidRepository) {
        this.listingRepository = listingRepository;
        this.bidRepository = bidRepository;
    }

    public BiddingListingResponse getListing(Long id) {
        return toResponse(findListing(id));
    }

    public List<BiddingListingResponse> getOpenListings() {
        return listingRepository.findByStatusOrderByCreatedAtDesc(BiddingStatus.OPEN).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<BiddingListingResponse> getFarmerListings(Long farmerId) {
        return listingRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId).stream()
                .filter(l -> l.getStatus() != BiddingStatus.CLOSED && l.getStatus() != BiddingStatus.CANCELLED)
                .map(this::toResponse)
                .toList();
    }

    public List<BidResponse> getBidsForListing(Long listingId) {
        return bidRepository.findByListingIdOrderByBidAmountDesc(listingId).stream()
                .map(this::toBidResponse)
                .toList();
    }

    public List<BidResponse> getDealerBids(Long dealerId) {
        return bidRepository.findByDealerIdOrderByBidTimeDesc(dealerId).stream()
                .map(this::toBidResponse)
                .toList();
    }

    public List<BiddingListingResponse> getAllListings() {
        return listingRepository.findAll().stream()
                .filter(l -> l.getStatus() != BiddingStatus.CLOSED && l.getStatus() != BiddingStatus.CANCELLED)
                .map(this::toResponse)
                .toList();
    }

    private BiddingListing findListing(Long id) {
        return listingRepository.findById(id).orElseThrow(() -> new BiddingNotFoundException(id));
    }

    private BiddingListingResponse toResponse(BiddingListing l) {
        List<BidResponse> bids = bidRepository.findByListingIdOrderByBidAmountDesc(l.getId()).stream()
                .map(this::toBidResponse)
                .toList();

        java.math.BigDecimal highest = l.getHighestBidAmount();
        if ((highest == null || highest.compareTo(java.math.BigDecimal.ZERO) <= 0) && !bids.isEmpty()) {
            highest = bids.get(0).bidAmount();
        } else if (highest == null) {
            highest = java.math.BigDecimal.ZERO;
        }

        return new BiddingListingResponse(
                l.getId(), l.getFarmerId(), l.getCropName(), l.getQuantity(),
                l.getUnit(), l.getBasePrice(), l.getGuidelinePrice(), l.getLocation(),
                l.getDescription(), l.getPhotoUrl(), l.getStatus(), highest,
                l.getWinningDealerId(), l.getCreatedAt(), bids
        );
    }

    private BidResponse toBidResponse(Bid b) {
        return new BidResponse(b.getId(), b.getListingId(), b.getDealerId(), b.getBidAmount(), b.getStatus(), b.getBidTime());
    }
}
