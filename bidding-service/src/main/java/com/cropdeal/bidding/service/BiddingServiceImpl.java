package com.cropdeal.bidding.service;

import com.cropdeal.bidding.client.PaymentServiceClient;
import com.cropdeal.bidding.config.RabbitMQConfig;
import com.cropdeal.bidding.dto.*;
import com.cropdeal.bidding.dto.WalletDto.*;
import com.cropdeal.bidding.entity.*;
import com.cropdeal.bidding.exception.BiddingExceptions.*;
import com.cropdeal.bidding.repository.BidRepository;
import com.cropdeal.bidding.repository.BiddingSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class BiddingServiceImpl implements BiddingService {

    private static final Logger log = LoggerFactory.getLogger(BiddingServiceImpl.class);

    private final BiddingSessionRepository sessionRepository;
    private final BidRepository bidRepository;
    private final RabbitTemplate rabbitTemplate;
    private final PaymentServiceClient paymentServiceClient;

    public BiddingServiceImpl(
            BiddingSessionRepository sessionRepository,
            BidRepository bidRepository,
            RabbitTemplate rabbitTemplate,
            PaymentServiceClient paymentServiceClient) {
        this.sessionRepository = sessionRepository;
        this.bidRepository = bidRepository;
        this.rabbitTemplate = rabbitTemplate;
        this.paymentServiceClient = paymentServiceClient;
    }

    @Override
    @Transactional
    public BiddingSessionResponse createSession(CreateBiddingSessionRequest request, Long farmerId, String userRole) {
        validateRole(userRole, "FARMER");
        if (request.getEndTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Auction end time must be in the future");
        }

        BiddingSession session = new BiddingSession();
        session.setCropId(request.getCropId());
        session.setFarmerId(farmerId != null ? farmerId : 1L);
        session.setCropName(request.getCropName().trim());
        session.setQuantity(request.getQuantity());
        session.setUnit(request.getUnit() != null && !request.getUnit().isBlank() ? request.getUnit().trim().toUpperCase() : "KG");
        session.setBasePrice(request.getBasePrice());
        session.setMinIncrement(request.getMinIncrement() != null ? request.getMinIncrement() : BigDecimal.valueOf(1.00));
        session.setStartTime(request.getStartTime() != null ? request.getStartTime() : LocalDateTime.now());
        session.setEndTime(request.getEndTime());
        session.setDistrict(request.getDistrict());
        session.setState(request.getState());
        session.setStatus(BiddingSessionStatus.ACTIVE);

        BiddingSession saved = sessionRepository.save(session);
        log.info("Created bidding session ID={} for crop={} by farmerId={}", saved.getId(), saved.getCropName(), saved.getFarmerId());
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BiddingSessionResponse> getActiveSessions() {
        return sessionRepository.findByStatusOrderByEndTimeAsc(BiddingSessionStatus.ACTIVE)
                .stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BiddingSessionResponse getSessionById(Long id) {
        return mapToResponse(findSession(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BiddingSessionResponse> getSessionsByFarmer(Long farmerId) {
        return sessionRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId)
                .stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional
    public BidResponse placeBid(Long sessionId, PlaceBidRequest request, Long dealerId, String userRole) {
        validateRole(userRole, "DEALER");
        Long effectiveDealerId = dealerId != null ? dealerId : 1L;
        BiddingSession session = findSession(sessionId);

        if (session.getStatus() != BiddingSessionStatus.ACTIVE || session.getEndTime().isBefore(LocalDateTime.now())) {
            throw new SessionClosedException("Bidding session is not active or has expired");
        }

        if (session.getFarmerId().equals(effectiveDealerId)) {
            throw new InvalidBidException("Farmer who listed the crop cannot bid on their own session");
        }

        BigDecimal minAllowed;
        if (session.getCurrentHighestBid() == null) {
            minAllowed = session.getBasePrice();
        } else {
            minAllowed = session.getCurrentHighestBid().add(session.getMinIncrement());
        }

        if (request.getBidAmount().compareTo(minAllowed) < 0) {
            throw new InvalidBidException(
                    String.format("Bid amount â‚¹%s is below the minimum required bid of â‚¹%s",
                            request.getBidAmount().toPlainString(), minAllowed.toPlainString()));
        }

        // 1. MANDATORY WALLET BALANCE CHECK
        try {
            WalletResponse wallet = paymentServiceClient.getWallet(effectiveDealerId);
            if (wallet == null || wallet.getBalance() == null || wallet.getBalance().compareTo(request.getBidAmount()) < 0) {
                BigDecimal currentBalance = (wallet != null && wallet.getBalance() != null) ? wallet.getBalance() : BigDecimal.ZERO;
                throw new InsufficientWalletBalanceException(
                        String.format("Insufficient wallet balance. Bidding is funded strictly through wallet. Current wallet balance: â‚¹%s, Required bid amount: â‚¹%s. Please top up your CropDeal wallet.",
                                currentBalance.toPlainString(), request.getBidAmount().toPlainString()));
            }
        } catch (InsufficientWalletBalanceException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Wallet service check exception: {}", e.getMessage());
            // If Feign throws direct business exception
            if (e.getMessage() != null && e.getMessage().contains("Insufficient")) {
                throw new InsufficientWalletBalanceException(e.getMessage());
            }
        }

        // 2. HOLD / ESCROW FUNDS FROM DEALER WALLET
        String holdRef = "BID_HOLD_SESSION_" + sessionId + "_DEALER_" + effectiveDealerId + "_" + UUID.randomUUID().toString().substring(0, 8);
        try {
            paymentServiceClient.debitWallet(new WalletDebitRequest(
                    effectiveDealerId,
                    "ROLE_DEALER",
                    request.getBidAmount(),
                    holdRef,
                    "BID_HOLD",
                    String.format("Held funds for bid of â‚¹%s on auction session #%d", request.getBidAmount().toPlainString(), sessionId)
            ));
        } catch (Exception e) {
            throw new InsufficientWalletBalanceException("Failed to hold wallet funds for bid: " + e.getMessage());
        }

        // 3. REFUND PREVIOUS HIGHEST BIDDER'S HELD FUNDS
        Long previousHighestBidder = session.getHighestBidderId();
        BigDecimal previousHighestAmount = session.getCurrentHighestBid();
        Long previousBidId = session.getHighestBidId();

        if (previousHighestBidder != null && previousHighestAmount != null) {
            // Refund previous bidder wallet
            String refundRef = "BID_REFUND_SESSION_" + sessionId + "_BID_" + (previousBidId != null ? previousBidId : System.currentTimeMillis());
            try {
                paymentServiceClient.creditWallet(new WalletCreditRequest(
                        previousHighestBidder,
                        "ROLE_DEALER",
                        previousHighestAmount,
                        refundRef,
                        "BID_REFUND",
                        String.format("Automatic refund for outbid on session #%d (Higher bid â‚¹%s placed)", sessionId, request.getBidAmount().toPlainString())
                ));
            } catch (Exception e) {
                log.error("Failed to refund previous highest bidder {}: {}", previousHighestBidder, e.getMessage());
            }

            // Mark previous bids as OUTBID
            List<Bid> existingBids = bidRepository.findBySessionIdOrderByBidTimeDesc(sessionId);
            for (Bid b : existingBids) {
                if (b.getStatus() == BidStatus.ACCEPTED) {
                    b.setStatus(BidStatus.OUTBID);
                    bidRepository.save(b);
                }
            }
        }

        // 4. SAVE NEW ACCEPTED BID
        Bid newBid = new Bid();
        newBid.setSession(session);
        newBid.setDealerId(effectiveDealerId);
        newBid.setBidAmount(request.getBidAmount());
        newBid.setWalletHoldRef(holdRef);
        newBid.setNotes(request.getNotes());
        newBid.setStatus(BidStatus.ACCEPTED);
        Bid savedBid = bidRepository.save(newBid);

        // 5. UPDATE SESSION STATE
        session.setCurrentHighestBid(request.getBidAmount());
        session.setHighestBidderId(effectiveDealerId);
        session.setHighestBidId(savedBid.getId());
        sessionRepository.save(session);

        // 6. PUBLISH RABBITMQ EVENTS
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.BIDDING_EXCHANGE,
                    RabbitMQConfig.BID_PLACED_ROUTING_KEY,
                    new BidEvents.BidPlacedEvent(sessionId, session.getCropId(), session.getFarmerId(), effectiveDealerId, newBid.getBidAmount())
            );

            if (previousHighestBidder != null && !previousHighestBidder.equals(effectiveDealerId)) {
                rabbitTemplate.convertAndSend(
                        RabbitMQConfig.BIDDING_EXCHANGE,
                        RabbitMQConfig.BID_OUTBID_ROUTING_KEY,
                        new BidEvents.BidOutbidEvent(sessionId, previousHighestBidder, previousHighestAmount, newBid.getBidAmount())
                );
            }
        } catch (Exception e) {
            log.error("Failed to publish bidding events to RabbitMQ: {}", e.getMessage());
        }

        log.info("Dealer {} placed wallet-backed bid â‚¹{} on session {}", effectiveDealerId, newBid.getBidAmount(), sessionId);
        return mapToBidResponse(savedBid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BidResponse> getBidsForSession(Long sessionId) {
        return bidRepository.findBySessionIdOrderByBidTimeDesc(sessionId)
                .stream().map(this::mapToBidResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BidResponse> getBidsByDealer(Long dealerId) {
        return bidRepository.findByDealerIdOrderByBidTimeDesc(dealerId)
                .stream().map(this::mapToBidResponse).toList();
    }

    @Override
    @Transactional
    public BiddingSessionResponse closeSession(Long sessionId, Long farmerId, String userRole) {
        BiddingSession session = findSession(sessionId);
        verifyFarmerOwnership(session, farmerId, userRole);

        session.setStatus(BiddingSessionStatus.COMPLETED);
        sessionRepository.save(session);

        if (session.getHighestBidderId() != null && session.getCurrentHighestBid() != null) {
            // Update winning bid
            List<Bid> bids = bidRepository.findBySessionIdOrderByBidTimeDesc(sessionId);
            for (Bid b : bids) {
                if (b.getDealerId().equals(session.getHighestBidderId()) && b.getStatus() == BidStatus.ACCEPTED) {
                    b.setStatus(BidStatus.WON);
                    bidRepository.save(b);
                    break;
                }
            }

            // Settle payment directly to Farmer's wallet
            String settleRef = "BID_SETTLE_SESSION_" + session.getId();
            try {
                paymentServiceClient.creditWallet(new WalletCreditRequest(
                        session.getFarmerId(),
                        "ROLE_FARMER",
                        session.getCurrentHighestBid(),
                        settleRef,
                        "BID_SETTLEMENT",
                        String.format("Auction winning payout for crop %s (Session #%d)", session.getCropName(), session.getId())
                ));
            } catch (Exception e) {
                log.error("Failed to credit farmer wallet on auction close: {}", e.getMessage());
            }

            try {
                rabbitTemplate.convertAndSend(
                        RabbitMQConfig.BIDDING_EXCHANGE,
                        RabbitMQConfig.BID_WON_ROUTING_KEY,
                        new BidEvents.BidWonEvent(session.getId(), session.getCropId(), session.getFarmerId(),
                                session.getHighestBidderId(), session.getCurrentHighestBid(), session.getQuantity())
                );
            } catch (Exception e) {
                log.error("Failed to publish BidWonEvent: {}", e.getMessage());
            }
        }

        log.info("Bidding session {} awarded to dealer {}", sessionId, session.getHighestBidderId());
        return mapToResponse(session);
    }

    @Override
    @Transactional
    public void cancelSession(Long sessionId, Long farmerId, String userRole) {
        BiddingSession session = findSession(sessionId);
        verifyFarmerOwnership(session, farmerId, userRole);
        session.setStatus(BiddingSessionStatus.CANCELLED);
        sessionRepository.save(session);

        // Refund active highest bidder if any
        if (session.getHighestBidderId() != null && session.getCurrentHighestBid() != null) {
            String refundRef = "BID_CANCEL_REFUND_SESSION_" + session.getId();
            try {
                paymentServiceClient.creditWallet(new WalletCreditRequest(
                        session.getHighestBidderId(),
                        "ROLE_DEALER",
                        session.getCurrentHighestBid(),
                        refundRef,
                        "BID_REFUND",
                        String.format("Refund for cancelled auction session #%d", session.getId())
                ));
            } catch (Exception e) {
                log.error("Failed to refund bidder on session cancellation: {}", e.getMessage());
            }

            List<Bid> bids = bidRepository.findBySessionIdOrderByBidTimeDesc(sessionId);
            for (Bid b : bids) {
                if (b.getStatus() == BidStatus.ACCEPTED) {
                    b.setStatus(BidStatus.CANCELLED);
                    bidRepository.save(b);
                }
            }
        }

        log.info("Bidding session {} cancelled by farmer {}", sessionId, farmerId);
    }

    private BiddingSession findSession(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bidding session not found with id: " + id));
    }

    private void verifyFarmerOwnership(BiddingSession session, Long farmerId, String role) {
        if (role != null && role.contains("ADMIN")) return;
        if (farmerId == null || !farmerId.equals(session.getFarmerId())) {
            throw new UnauthorizedAccessException("You are not authorized to manage this bidding session");
        }
    }

    private void validateRole(String role, String requiredRole) {
        if (role == null) return;
        String clean = role.replace("ROLE_", "").toUpperCase();
        if (!clean.contains(requiredRole) && !clean.contains("ADMIN")) {
            throw new UnauthorizedAccessException("Only " + requiredRole + " role can perform this operation");
        }
    }

    private BiddingSessionResponse mapToResponse(BiddingSession s) {
        BiddingSessionResponse r = new BiddingSessionResponse();
        r.setId(s.getId());
        r.setCropId(s.getCropId());
        r.setFarmerId(s.getFarmerId());
        r.setCropName(s.getCropName());
        r.setQuantity(s.getQuantity());
        r.setUnit(s.getUnit());
        r.setBasePrice(s.getBasePrice());
        r.setMinIncrement(s.getMinIncrement());
        r.setCurrentHighestBid(s.getCurrentHighestBid());
        r.setHighestBidderId(s.getHighestBidderId());
        r.setStartTime(s.getStartTime());
        r.setEndTime(s.getEndTime());
        r.setStatus(s.getStatus());
        r.setDistrict(s.getDistrict());
        r.setState(s.getState());
        r.setCreatedAt(s.getCreatedAt());
        r.setUpdatedAt(s.getUpdatedAt());
        return r;
    }

    private BidResponse mapToBidResponse(Bid b) {
        BidResponse r = new BidResponse();
        r.setId(b.getId());
        r.setSessionId(b.getSession().getId());
        r.setDealerId(b.getDealerId());
        r.setBidAmount(b.getBidAmount());
        r.setBidTime(b.getBidTime());
        r.setStatus(b.getStatus());
        r.setWalletHoldRef(b.getWalletHoldRef());
        r.setNotes(b.getNotes());
        return r;
    }
}