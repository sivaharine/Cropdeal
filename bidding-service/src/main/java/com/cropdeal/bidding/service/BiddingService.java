package com.cropdeal.bidding.service;

import com.cropdeal.bidding.dto.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface BiddingService {
    BiddingListingResponse createListing(CreateBiddingRequest request);
    BiddingListingResponse getListing(Long id);
    List<BiddingListingResponse> getOpenListings();
    List<BiddingListingResponse> getFarmerListings(Long farmerId);
    BidResponse placeBid(Long listingId, PlaceBidRequest request);
    List<BidResponse> getBidsForListing(Long listingId);
    List<BidResponse> getDealerBids(Long dealerId);
    BiddingListingResponse closeBidding(Long listingId);
    BiddingListingResponse sellListing(Long listingId);
    String uploadPhoto(Long listingId, MultipartFile file);
    String uploadImage(MultipartFile file);
    List<BiddingListingResponse> getAllListings();
    void deleteListing(Long listingId);
    BiddingListingResponse toggleBlockListing(Long listingId, boolean block);
}