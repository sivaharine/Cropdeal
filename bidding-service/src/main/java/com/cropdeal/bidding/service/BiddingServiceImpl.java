package com.cropdeal.bidding.service;

import com.cropdeal.bidding.command.BiddingCommandService;
import com.cropdeal.bidding.dto.*;
import com.cropdeal.bidding.query.BiddingQueryService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Unified BiddingServiceImpl acting as a facade for CQRS Command and Query handlers.
 */
@Service
public class BiddingServiceImpl implements BiddingService {

    private final BiddingCommandService commandService;
    private final BiddingQueryService queryService;

    public BiddingServiceImpl(BiddingCommandService commandService,
                              BiddingQueryService queryService) {
        this.commandService = commandService;
        this.queryService = queryService;
    }

    // Commands
    @Override
    public BiddingListingResponse createListing(CreateBiddingRequest request) {
        return commandService.createListing(request);
    }

    @Override
    public BidResponse placeBid(Long listingId, PlaceBidRequest request) {
        return commandService.placeBid(listingId, request);
    }

    @Override
    public BiddingListingResponse closeBidding(Long listingId) {
        return commandService.closeBidding(listingId);
    }

    @Override
    public BiddingListingResponse sellListing(Long listingId) {
        return commandService.sellListing(listingId);
    }

    @Override
    public String uploadPhoto(Long listingId, MultipartFile file) {
        return commandService.uploadPhoto(listingId, file);
    }

    @Override
    public void deleteListing(Long listingId) {
        commandService.deleteListing(listingId);
    }

    @Override
    public BiddingListingResponse toggleBlockListing(Long listingId, boolean block) {
        return commandService.toggleBlockListing(listingId, block);
    }

    // Queries
    @Override
    public BiddingListingResponse getListing(Long id) {
        return queryService.getListing(id);
    }

    @Override
    public List<BiddingListingResponse> getOpenListings() {
        return queryService.getOpenListings();
    }

    @Override
    public List<BiddingListingResponse> getFarmerListings(Long farmerId) {
        return queryService.getFarmerListings(farmerId);
    }

    @Override
    public List<BidResponse> getBidsForListing(Long listingId) {
        return queryService.getBidsForListing(listingId);
    }

    @Override
    public List<BidResponse> getDealerBids(Long dealerId) {
        return queryService.getDealerBids(dealerId);
    }

    @Override
    public List<BiddingListingResponse> getAllListings() {
        return queryService.getAllListings();
    }
}