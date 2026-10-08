package com.cropdeal.bidding.service;

import com.cropdeal.bidding.client.OrderClient;
import com.cropdeal.bidding.client.WalletClient;
import com.cropdeal.bidding.dto.*;
import com.cropdeal.bidding.entity.*;
import com.cropdeal.bidding.exception.BiddingNotFoundException;
import com.cropdeal.bidding.exception.InvalidBidException;
import com.cropdeal.bidding.repository.BidRepository;
import com.cropdeal.bidding.repository.BiddingListingRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class BiddingServiceImpl implements BiddingService {

    private final BiddingListingRepository listingRepository;
    private final BidRepository bidRepository;
    private final WalletClient walletClient;
    private final OrderClient orderClient;

    @Value("${file.upload-dir:D:/Cropdeal/uploads/bidding}")
    private String uploadDir;

    public BiddingServiceImpl(BiddingListingRepository listingRepository,
                              BidRepository bidRepository,
                              WalletClient walletClient,
                              OrderClient orderClient) {
        this.listingRepository = listingRepository;
        this.bidRepository = bidRepository;
        this.walletClient = walletClient;
        this.orderClient = orderClient;
    }

    @Override
    public BiddingListingResponse createListing(CreateBiddingRequest request) {
        BiddingListing listing = new BiddingListing();
        listing.setFarmerId(request.farmerId());
        listing.setCropName(request.cropName());
        listing.setQuantity(request.quantity());
        listing.setUnit(request.unit());
        listing.setBasePrice(request.basePrice());
        listing.setGuidelinePrice(request.guidelinePrice());
        listing.setLocation(request.location());
        listing.setDescription(request.description());
        listing.setStatus(BiddingStatus.OPEN);
        listing.setHighestBidAmount(BigDecimal.ZERO);

        return toResponse(listingRepository.save(listing));
    }

    @Override
    @Transactional(readOnly = true)
    public BiddingListingResponse getListing(Long id) {
        return toResponse(findListing(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BiddingListingResponse> getOpenListings() {
        return listingRepository.findByStatusOrderByCreatedAtDesc(BiddingStatus.OPEN).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BiddingListingResponse> getFarmerListings(Long farmerId) {
        return listingRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public BidResponse placeBid(Long listingId, PlaceBidRequest request) {
        BiddingListing listing = findListing(listingId);

        if (listing.getStatus() != BiddingStatus.OPEN) {
            throw new InvalidBidException("Bidding is closed for listing id: " + listingId);
        }

        // Validate bid amount
        BigDecimal minRequired = listing.getHighestBidAmount().compareTo(BigDecimal.ZERO) > 0
                ? listing.getHighestBidAmount()
                : listing.getBasePrice();

        if (request.bidAmount().compareTo(minRequired) <= 0) {
            throw new InvalidBidException("Bid amount must be strictly higher than ₹" + minRequired);
        }

        String newRefId = "BID-" + listingId + "-" + request.dealerId();

        // 1. Reserve funds in dealer's wallet (throws InsufficientWalletBalanceException if low balance)
        walletClient.reserveFunds(new WalletClient.ReserveRequest(request.dealerId(), newRefId, request.bidAmount()));

        // 2. If previous active highest bid exists from another dealer, release their funds!
        bidRepository.findFirstByListingIdAndStatusOrderByBidAmountDesc(listingId, BidStatus.ACTIVE).ifPresent(prev -> {
            if (!prev.getDealerId().equals(request.dealerId())) {
                prev.setStatus(BidStatus.OUTBID);
                bidRepository.save(prev);
                try {
                    String prevRefId = "BID-" + listingId + "-" + prev.getDealerId();
                    walletClient.releaseFunds(new WalletClient.ReleaseRequest(prev.getDealerId(), prevRefId));
                } catch (Exception e) {
                    // Log release failure
                }
            } else {
                prev.setStatus(BidStatus.OUTBID);
                bidRepository.save(prev);
            }
        });

        // 3. Save new bid
        Bid bid = new Bid();
        bid.setListingId(listingId);
        bid.setDealerId(request.dealerId());
        bid.setBidAmount(request.bidAmount());
        bid.setStatus(BidStatus.ACTIVE);
        Bid savedBid = bidRepository.save(bid);

        // 4. Update listing highest bid
        listing.setHighestBidAmount(request.bidAmount());
        listing.setWinningDealerId(request.dealerId());
        listing.setWinningBidId(savedBid.getId());
        listingRepository.save(listing);

        return toBidResponse(savedBid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BidResponse> getBidsForListing(Long listingId) {
        return bidRepository.findByListingIdOrderByBidAmountDesc(listingId).stream()
                .map(this::toBidResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BidResponse> getDealerBids(Long dealerId) {
        return bidRepository.findByDealerIdOrderByBidTimeDesc(dealerId).stream()
                .map(this::toBidResponse)
                .toList();
    }

    @Override
    public BiddingListingResponse closeBidding(Long listingId) {
        BiddingListing listing = findListing(listingId);
        if (listing.getStatus() != BiddingStatus.OPEN) {
            throw new InvalidBidException("Listing is not open");
        }
        listing.setStatus(BiddingStatus.CLOSED);

        bidRepository.findFirstByListingIdAndStatusOrderByBidAmountDesc(listingId, BidStatus.ACTIVE)
                .ifPresent(winningBid -> {
                    winningBid.setStatus(BidStatus.WINNING);
                    bidRepository.save(winningBid);
                });

        return toResponse(listingRepository.save(listing));
    }

    @Override
    public BiddingListingResponse sellListing(Long listingId) {
        BiddingListing listing = findListing(listingId);
        if (listing.getStatus() != BiddingStatus.CLOSED) {
            throw new InvalidBidException("Bidding must be closed before selling to winner");
        }
        if (listing.getWinningDealerId() == null || listing.getHighestBidAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidBidException("No valid winning bid to sell to");
        }

        // 1. Consume reserved wallet funds for the winning dealer
        String refId = "BID-" + listingId + "-" + listing.getWinningDealerId();
        walletClient.consumeFunds(new WalletClient.ConsumeRequest(listing.getWinningDealerId(), refId));

        // 2. Create order via order-service
        try {
            orderClient.createOrder(new OrderClient.CreateOrderRequest(
                    listing.getFarmerId(),
                    listing.getWinningDealerId(),
                    listing.getId(),
                    listing.getCropName(),
                    listing.getQuantity().intValue(),
                    listing.getHighestBidAmount()
            ));
        } catch (Exception e) {
            // Order creation logged
        }

        listing.setStatus(BiddingStatus.SOLD);
        return toResponse(listingRepository.save(listing));
    }

    @Override
    public String uploadPhoto(Long listingId, MultipartFile file) {
        BiddingListing listing = findListing(listingId);
        if (file.isEmpty()) {
            throw new InvalidBidException("File cannot be empty");
        }
        try {
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();

            String ext = "";
            String orig = file.getOriginalFilename();
            if (orig != null && orig.contains(".")) {
                ext = orig.substring(orig.lastIndexOf("."));
            }
            String filename = "listing_" + listingId + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;
            Path targetPath = Paths.get(uploadDir, filename);
            Files.copy(file.getInputStream(), targetPath);

            String photoUrl = "/uploads/bidding/" + filename;
            listing.setPhotoUrl(photoUrl);
            listingRepository.save(listing);
            return photoUrl;
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload photo: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<BiddingListingResponse> getAllListings() {
        return listingRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public void deleteListing(Long listingId) {
        bidRepository.deleteAll(bidRepository.findByListingIdOrderByBidAmountDesc(listingId));
        listingRepository.deleteById(listingId);
    }

    @Override
    public BiddingListingResponse toggleBlockListing(Long listingId, boolean block) {
        BiddingListing listing = findListing(listingId);
        listing.setStatus(block ? BiddingStatus.BLOCKED : BiddingStatus.OPEN);
        return toResponse(listingRepository.save(listing));
    }

    private BiddingListing findListing(Long id) {
        return listingRepository.findById(id).orElseThrow(() -> new BiddingNotFoundException(id));
    }

    private BiddingListingResponse toResponse(BiddingListing l) {
        List<BidResponse> bids = bidRepository.findByListingIdOrderByBidAmountDesc(l.getId()).stream()
                .map(this::toBidResponse)
                .toList();

        return new BiddingListingResponse(
                l.getId(), l.getFarmerId(), l.getCropName(), l.getQuantity(),
                l.getUnit(), l.getBasePrice(), l.getGuidelinePrice(), l.getLocation(),
                l.getDescription(), l.getPhotoUrl(), l.getStatus(), l.getHighestBidAmount(),
                l.getWinningDealerId(), l.getCreatedAt(), bids
        );
    }

    private BidResponse toBidResponse(Bid b) {
        return new BidResponse(b.getId(), b.getListingId(), b.getDealerId(), b.getBidAmount(), b.getStatus(), b.getBidTime());
    }
}