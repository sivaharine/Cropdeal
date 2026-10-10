package com.cropdeal.bidding.dto;

import com.cropdeal.bidding.entity.BiddingStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BiddingListingResponse(
    Long id,
    Long farmerId,
    String cropName,
    BigDecimal quantity,
    String unit,
    BigDecimal basePrice,
    BigDecimal guidelinePrice,
    String location,
    String description,
    String photoUrl,
    BiddingStatus status,
    BigDecimal highestBidAmount,
    Long winningDealerId,
    LocalDateTime createdAt,
    List<BidResponse> bids
) {}