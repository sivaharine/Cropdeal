package com.cropdeal.bidding.dto;

import com.cropdeal.bidding.entity.BidStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BidResponse(
    Long id,
    Long listingId,
    Long dealerId,
    BigDecimal bidAmount,
    BidStatus status,
    LocalDateTime bidTime
) {}