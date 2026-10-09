package com.cropdeal.bidding.controller;

import com.cropdeal.bidding.dto.BidResponse;
import com.cropdeal.bidding.service.BiddingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bids")
public class BidController {

    private final BiddingService biddingService;

    public BidController(BiddingService biddingService) {
        this.biddingService = biddingService;
    }

    @GetMapping("/dealer/{dealerId}")
    public ResponseEntity<List<BidResponse>> getDealerBids(@PathVariable Long dealerId) {
        return ResponseEntity.ok(biddingService.getDealerBids(dealerId));
    }
}