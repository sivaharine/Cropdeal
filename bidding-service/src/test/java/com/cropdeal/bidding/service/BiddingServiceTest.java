package com.cropdeal.bidding.service;

import com.cropdeal.bidding.client.OrderClient;
import com.cropdeal.bidding.client.WalletClient;
import com.cropdeal.bidding.dto.BiddingListingResponse;
import com.cropdeal.bidding.dto.BidResponse;
import com.cropdeal.bidding.dto.CreateBiddingRequest;
import com.cropdeal.bidding.dto.PlaceBidRequest;
import com.cropdeal.bidding.entity.Bid;
import com.cropdeal.bidding.entity.BidStatus;
import com.cropdeal.bidding.entity.BiddingListing;
import com.cropdeal.bidding.entity.BiddingStatus;
import com.cropdeal.bidding.exception.BiddingNotFoundException;
import com.cropdeal.bidding.exception.InvalidBidException;
import com.cropdeal.bidding.repository.BidRepository;
import com.cropdeal.bidding.repository.BiddingListingRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BiddingServiceTest {

    @Mock
    private BiddingListingRepository listingRepository;

    @Mock
    private BidRepository bidRepository;

    @Mock
    private WalletClient walletClient;

    @Mock
    private OrderClient orderClient;

    @InjectMocks
    private BiddingServiceImpl biddingService;

    @Test
    @DisplayName("Create bidding listing succeeds with OPEN status")
    void testCreateListing() {
        CreateBiddingRequest req = new CreateBiddingRequest(
                1L, "Wheat", new BigDecimal("100.0"), "kg", new BigDecimal("50.00"),
                new BigDecimal("55.00"), "Punjab", "Premium Sharbati Wheat");

        when(listingRepository.save(any(BiddingListing.class))).thenAnswer(i -> {
            BiddingListing l = i.getArgument(0);
            l.setId(10L);
            return l;
        });

        BiddingListingResponse res = biddingService.createListing(req);
        assertNotNull(res);
        assertEquals(10L, res.id());
        assertEquals(BiddingStatus.OPEN, res.status());
        assertEquals(new BigDecimal("50.00"), res.basePrice());
    }

    @Test
    @DisplayName("Place bid higher than base price updates highest bid")
    void testPlaceBidSuccess() {
        BiddingListing listing = new BiddingListing();
        listing.setId(10L);
        listing.setFarmerId(1L);
        listing.setBasePrice(new BigDecimal("50.00"));
        listing.setHighestBidAmount(BigDecimal.ZERO);
        listing.setStatus(BiddingStatus.OPEN);

        PlaceBidRequest req = new PlaceBidRequest(5L, new BigDecimal("60.00"));

        when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));
        when(bidRepository.findFirstByListingIdAndStatusOrderByBidAmountDesc(10L, BidStatus.ACTIVE)).thenReturn(Optional.empty());
        when(bidRepository.save(any(Bid.class))).thenAnswer(i -> {
            Bid b = i.getArgument(0);
            b.setId(100L);
            return b;
        });
        when(listingRepository.save(any(BiddingListing.class))).thenAnswer(i -> i.getArgument(0));

        BidResponse res = biddingService.placeBid(10L, req);

        assertNotNull(res);
        assertEquals(new BigDecimal("60.00"), res.bidAmount());
        assertEquals(new BigDecimal("60.00"), listing.getHighestBidAmount());
        assertEquals(5L, listing.getWinningDealerId());
        verify(walletClient, times(1)).reserveFunds(any());
    }

    @Test
    @DisplayName("Place bid lower than current highest bid throws InvalidBidException")
    void testPlaceBidLowerThanHighestThrows() {
        BiddingListing listing = new BiddingListing();
        listing.setId(10L);
        listing.setBasePrice(new BigDecimal("50.00"));
        listing.setHighestBidAmount(new BigDecimal("70.00"));
        listing.setStatus(BiddingStatus.OPEN);

        PlaceBidRequest req = new PlaceBidRequest(5L, new BigDecimal("65.00"));

        when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));

        assertThrows(InvalidBidException.class, () -> biddingService.placeBid(10L, req));
        verify(bidRepository, never()).save(any());
    }

    @Test
    @DisplayName("Place bid on closed listing throws InvalidBidException")
    void testPlaceBidOnClosedListingThrows() {
        BiddingListing listing = new BiddingListing();
        listing.setId(10L);
        listing.setStatus(BiddingStatus.CLOSED);

        PlaceBidRequest req = new PlaceBidRequest(5L, new BigDecimal("60.00"));

        when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));

        assertThrows(InvalidBidException.class, () -> biddingService.placeBid(10L, req));
    }

    @Test
    @DisplayName("Get listing throws BiddingNotFoundException if not found")
    void testGetListingNotFoundThrows() {
        when(listingRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(BiddingNotFoundException.class, () -> biddingService.getListing(999L));
    }
}
