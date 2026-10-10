package com.cropdeal.bidding.command;

import com.cropdeal.bidding.client.OrderClient;
import com.cropdeal.bidding.client.WalletClient;
import com.cropdeal.bidding.dto.BidResponse;
import com.cropdeal.bidding.dto.BiddingListingResponse;
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
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

/**
 * CQRS Command Service for Bidding writes (create listing, place bid, close, sell, delete, toggle block).
 */
@Service
@Transactional
public class BiddingCommandService {

    private final BiddingListingRepository listingRepository;
    private final BidRepository bidRepository;
    private final WalletClient walletClient;
    private final OrderClient orderClient;
    private final com.cropdeal.bidding.service.CloudinaryService cloudinaryService;

    @Value("${file.upload-dir:D:/Cropdeal/uploads/bidding}")
    private String uploadDir;

    public BiddingCommandService(BiddingListingRepository listingRepository,
                                 BidRepository bidRepository,
                                 WalletClient walletClient,
                                 OrderClient orderClient,
                                 com.cropdeal.bidding.service.CloudinaryService cloudinaryService) {
        this.listingRepository = listingRepository;
        this.bidRepository = bidRepository;
        this.walletClient = walletClient;
        this.orderClient = orderClient;
        this.cloudinaryService = cloudinaryService;
    }

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
        if (request.photoUrl() != null && !request.photoUrl().isBlank()) {
            listing.setPhotoUrl(request.photoUrl());
        }
        listing.setStatus(BiddingStatus.OPEN);
        listing.setHighestBidAmount(BigDecimal.ZERO);

        return toResponse(listingRepository.save(listing));
    }

    public BidResponse placeBid(Long listingId, PlaceBidRequest request) {
        BiddingListing listing = findListing(listingId);

        if (listing.getStatus() != BiddingStatus.OPEN) {
            throw new InvalidBidException("Bidding is closed for listing id: " + listingId);
        }

        boolean hasExistingBid = listing.getHighestBidAmount() != null && listing.getHighestBidAmount().compareTo(BigDecimal.ZERO) > 0;
        if (hasExistingBid) {
            if (request.bidAmount().compareTo(listing.getHighestBidAmount()) <= 0) {
                throw new InvalidBidException("Bid amount must be strictly higher than the current highest bid of ₹" + listing.getHighestBidAmount());
            }
        } else {
            if (request.bidAmount().compareTo(listing.getBasePrice()) < 0) {
                throw new InvalidBidException("Bid amount must be at least the starting price of ₹" + listing.getBasePrice());
            }
        }

        String newRefId = "BID-" + listingId + "-" + request.dealerId();

        walletClient.reserveFunds(new WalletClient.ReserveRequest(request.dealerId(), newRefId, request.bidAmount()));

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

        Bid bid = new Bid();
        bid.setListingId(listingId);
        bid.setDealerId(request.dealerId());
        bid.setBidAmount(request.bidAmount());
        bid.setStatus(BidStatus.ACTIVE);
        Bid savedBid = bidRepository.save(bid);

        listing.setHighestBidAmount(request.bidAmount());
        listing.setWinningDealerId(request.dealerId());
        listing.setWinningBidId(savedBid.getId());
        listingRepository.save(listing);

        return toBidResponse(savedBid);
    }

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

    public BiddingListingResponse sellListing(Long listingId) {
        BiddingListing listing = findListing(listingId);
        if (listing.getStatus() != BiddingStatus.CLOSED) {
            throw new InvalidBidException("Bidding must be closed before selling to winner");
        }
        if (listing.getWinningDealerId() == null || listing.getHighestBidAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidBidException("No valid winning bid to sell to");
        }

        String refId = "BID-" + listingId + "-" + listing.getWinningDealerId();
        walletClient.consumeFunds(new WalletClient.ConsumeRequest(listing.getWinningDealerId(), refId));

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
            // Log error
        }

        listing.setStatus(BiddingStatus.SOLD);
        return toResponse(listingRepository.save(listing));
    }

    public String uploadImage(MultipartFile file) {
        if (file.isEmpty()) {
            throw new InvalidBidException("File cannot be empty");
        }
        try {
            return cloudinaryService.uploadImage(file, "cropdeal/bidding");
        } catch (Exception e) {
            // Local fallback
            try {
                File dir = new File(uploadDir);
                if (!dir.exists()) dir.mkdirs();
                String ext = "";
                String orig = file.getOriginalFilename();
                if (orig != null && orig.contains(".")) {
                    ext = orig.substring(orig.lastIndexOf("."));
                }
                String filename = "bidding_" + UUID.randomUUID().toString().substring(0, 8) + ext;
                Path targetPath = Paths.get(uploadDir, filename);
                Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
                return "/uploads/bidding/" + filename;
            } catch (IOException ioEx) {
                throw new RuntimeException("Failed to store image: " + ioEx.getMessage(), ioEx);
            }
        }
    }

    public String uploadPhoto(Long listingId, MultipartFile file) {
        BiddingListing listing = findListing(listingId);
        String photoUrl = uploadImage(file);
        listing.setPhotoUrl(photoUrl);
        listingRepository.save(listing);
        return photoUrl;
    }

    public void deleteListing(Long listingId) {
        BiddingListing listing = findListing(listingId);
        listing.setStatus(BiddingStatus.CLOSED);
        listingRepository.save(listing);
    }

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
