package com.cropdeal.bidding.service;

import com.cropdeal.bidding.dto.*;

import java.util.List;

public interface BiddingService {
    BiddingSessionResponse createSession(CreateBiddingSessionRequest request, Long farmerId, String userRole);
    List<BiddingSessionResponse> getActiveSessions();
    BiddingSessionResponse getSessionById(Long id);
    List<BiddingSessionResponse> getSessionsByFarmer(Long farmerId);
    BidResponse placeBid(Long sessionId, PlaceBidRequest request, Long dealerId, String userRole);
    List<BidResponse> getBidsForSession(Long sessionId);
    List<BidResponse> getBidsByDealer(Long dealerId);
    BiddingSessionResponse closeSession(Long sessionId, Long farmerId, String userRole);
    void cancelSession(Long sessionId, Long farmerId, String userRole);
}