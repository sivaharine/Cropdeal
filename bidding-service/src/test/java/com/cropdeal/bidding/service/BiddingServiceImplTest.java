package com.cropdeal.bidding.service;

import com.cropdeal.bidding.client.PaymentServiceClient;
import com.cropdeal.bidding.dto.CreateBiddingSessionRequest;
import com.cropdeal.bidding.dto.PlaceBidRequest;
import com.cropdeal.bidding.dto.BidResponse;
import com.cropdeal.bidding.dto.BiddingSessionResponse;
import com.cropdeal.bidding.dto.WalletDto.*;
import com.cropdeal.bidding.entity.Bid;
import com.cropdeal.bidding.entity.BidStatus;
import com.cropdeal.bidding.entity.BiddingSession;
import com.cropdeal.bidding.entity.BiddingSessionStatus;
import com.cropdeal.bidding.exception.BiddingExceptions.*;
import com.cropdeal.bidding.repository.BidRepository;
import com.cropdeal.bidding.repository.BiddingSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BiddingServiceImplTest {

    @Mock
    private BiddingSessionRepository sessionRepository;

    @Mock
    private BidRepository bidRepository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @Mock
    private PaymentServiceClient paymentServiceClient;

    @InjectMocks
    private BiddingServiceImpl biddingService;

    private BiddingSession session;

    @BeforeEach
    void setUp() {
        session = new BiddingSession();
        session.setId(10L);
        session.setCropId(101L);
        session.setFarmerId(1L);
        session.setCropName("Organic Wheat");
        session.setQuantity(new BigDecimal("500.00"));
        session.setUnit("KG");
        session.setBasePrice(new BigDecimal("20.00"));
        session.setMinIncrement(new BigDecimal("1.00"));
        session.setCurrentHighestBid(null);
        session.setHighestBidderId(null);
        session.setStatus(BiddingSessionStatus.ACTIVE);
        session.setStartTime(LocalDateTime.now().minusHours(1));
        session.setEndTime(LocalDateTime.now().plusHours(24));
        session.setCreatedAt(LocalDateTime.now().minusHours(1));
        session.setUpdatedAt(LocalDateTime.now().minusHours(1));
        session.setBids(new ArrayList<>());
    }

    @Test
    @DisplayName("Should successfully create a new bidding session for a farmer")
    void testCreateSessionSuccess() {
        CreateBiddingSessionRequest request = new CreateBiddingSessionRequest();
        request.setCropId(101L);
        request.setCropName("Organic Wheat");
        request.setQuantity(new BigDecimal("500.00"));
        request.setUnit("KG");
        request.setBasePrice(new BigDecimal("20.00"));
        request.setMinIncrement(new BigDecimal("1.00"));
        request.setEndTime(LocalDateTime.now().plusDays(2));
        request.setDistrict("Pune");
        request.setState("Maharashtra");

        when(sessionRepository.save(any(BiddingSession.class))).thenAnswer(invocation -> {
            BiddingSession s = invocation.getArgument(0);
            s.setId(10L);
            return s;
        });

        BiddingSessionResponse response = biddingService.createSession(request, 1L, "ROLE_FARMER");

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("Organic Wheat", response.getCropName());
        assertEquals(BiddingSessionStatus.ACTIVE, response.getStatus());
        verify(sessionRepository, times(1)).save(any(BiddingSession.class));
    }

    @Test
    @DisplayName("Should place bid when dealer has sufficient wallet balance")
    void testPlaceBidWalletSuccess() {
        PlaceBidRequest request = new PlaceBidRequest();
        request.setBidAmount(new BigDecimal("25.00"));
        request.setNotes("First bid");

        WalletResponse wallet = new WalletResponse();
        wallet.setUserId(2L);
        wallet.setBalance(new BigDecimal("1000.00"));

        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(paymentServiceClient.getWallet(2L)).thenReturn(wallet);
        when(paymentServiceClient.debitWallet(any(WalletDebitRequest.class))).thenReturn(wallet);
        when(bidRepository.save(any(Bid.class))).thenAnswer(invocation -> {
            Bid b = invocation.getArgument(0);
            b.setId(100L);
            return b;
        });
        when(sessionRepository.save(any(BiddingSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BidResponse response = biddingService.placeBid(10L, request, 2L, "ROLE_DEALER");

        assertNotNull(response);
        assertEquals(new BigDecimal("25.00"), response.getBidAmount());
        assertEquals(BidStatus.ACCEPTED, response.getStatus());
        assertEquals(2L, response.getDealerId());

        // Verify wallet debit called
        verify(paymentServiceClient, times(1)).debitWallet(any(WalletDebitRequest.class));
        verify(sessionRepository, times(1)).save(any(BiddingSession.class));
    }

    @Test
    @DisplayName("Should reject bid when dealer has insufficient wallet balance")
    void testPlaceBidInsufficientWalletBalance() {
        PlaceBidRequest request = new PlaceBidRequest();
        request.setBidAmount(new BigDecimal("500.00"));

        WalletResponse wallet = new WalletResponse();
        wallet.setUserId(2L);
        wallet.setBalance(new BigDecimal("50.00")); // only 50 in wallet

        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(paymentServiceClient.getWallet(2L)).thenReturn(wallet);

        assertThrows(InsufficientWalletBalanceException.class, () ->
                biddingService.placeBid(10L, request, 2L, "ROLE_DEALER"));

        verify(paymentServiceClient, never()).debitWallet(any(WalletDebitRequest.class));
        verify(bidRepository, never()).save(any(Bid.class));
    }

    @Test
    @DisplayName("Should refund previous bidder wallet when new highest bid is placed")
    void testOutbidRefundsPreviousBidderWallet() {
        // First bid was 25.00 by dealer 2
        session.setCurrentHighestBid(new BigDecimal("25.00"));
        session.setHighestBidderId(2L);
        session.setHighestBidId(100L);

        Bid prevBid = new Bid();
        prevBid.setId(100L);
        prevBid.setSession(session);
        prevBid.setDealerId(2L);
        prevBid.setBidAmount(new BigDecimal("25.00"));
        prevBid.setStatus(BidStatus.ACCEPTED);

        // Dealer 3 bids 30.00
        PlaceBidRequest request = new PlaceBidRequest();
        request.setBidAmount(new BigDecimal("30.00"));

        WalletResponse walletDealer3 = new WalletResponse();
        walletDealer3.setUserId(3L);
        walletDealer3.setBalance(new BigDecimal("1000.00"));

        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(paymentServiceClient.getWallet(3L)).thenReturn(walletDealer3);
        when(paymentServiceClient.debitWallet(any(WalletDebitRequest.class))).thenReturn(walletDealer3);
        when(paymentServiceClient.creditWallet(any(WalletCreditRequest.class))).thenReturn(new WalletResponse());
        when(bidRepository.findBySessionIdOrderByBidTimeDesc(10L)).thenReturn(List.of(prevBid));
        when(bidRepository.save(any(Bid.class))).thenAnswer(invocation -> {
            Bid b = invocation.getArgument(0);
            if (b.getId() == null) b.setId(101L);
            return b;
        });
        when(sessionRepository.save(any(BiddingSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BidResponse response = biddingService.placeBid(10L, request, 3L, "ROLE_DEALER");

        assertNotNull(response);
        assertEquals(new BigDecimal("30.00"), response.getBidAmount());
        assertEquals(3L, response.getDealerId());

        // Verify dealer 2 received automatic wallet refund of 25.00
        verify(paymentServiceClient, times(1)).creditWallet(argThat(creditReq ->
                creditReq.getUserId().equals(2L) &&
                creditReq.getAmount().compareTo(new BigDecimal("25.00")) == 0 &&
                "BID_REFUND".equals(creditReq.getTransactionType())
        ));
        assertEquals(BidStatus.OUTBID, prevBid.getStatus());
    }

    @Test
    @DisplayName("Should settle winning bid to farmer wallet upon closing session")
    void testCloseSessionSettlesPayoutToFarmer() {
        session.setCurrentHighestBid(new BigDecimal("35.00"));
        session.setHighestBidderId(3L);

        Bid winningBid = new Bid();
        winningBid.setId(101L);
        winningBid.setSession(session);
        winningBid.setDealerId(3L);
        winningBid.setBidAmount(new BigDecimal("35.00"));
        winningBid.setStatus(BidStatus.ACCEPTED);

        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(bidRepository.findBySessionIdOrderByBidTimeDesc(10L)).thenReturn(List.of(winningBid));
        when(paymentServiceClient.creditWallet(any(WalletCreditRequest.class))).thenReturn(new WalletResponse());
        when(sessionRepository.save(any(BiddingSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BiddingSessionResponse response = biddingService.closeSession(10L, 1L, "ROLE_FARMER");

        assertNotNull(response);
        assertEquals(BiddingSessionStatus.COMPLETED, response.getStatus());
        assertEquals(BidStatus.WON, winningBid.getStatus());

        // Verify farmer wallet credited with winning amount
        verify(paymentServiceClient, times(1)).creditWallet(argThat(creditReq ->
                creditReq.getUserId().equals(1L) &&
                creditReq.getAmount().compareTo(new BigDecimal("35.00")) == 0 &&
                "BID_SETTLEMENT".equals(creditReq.getTransactionType())
        ));
    }

    @Test
    @DisplayName("Should refund active bidder when session is cancelled")
    void testCancelSessionRefundsBidder() {
        session.setCurrentHighestBid(new BigDecimal("35.00"));
        session.setHighestBidderId(3L);

        Bid activeBid = new Bid();
        activeBid.setId(101L);
        activeBid.setSession(session);
        activeBid.setDealerId(3L);
        activeBid.setBidAmount(new BigDecimal("35.00"));
        activeBid.setStatus(BidStatus.ACCEPTED);

        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(bidRepository.findBySessionIdOrderByBidTimeDesc(10L)).thenReturn(List.of(activeBid));
        when(paymentServiceClient.creditWallet(any(WalletCreditRequest.class))).thenReturn(new WalletResponse());
        when(sessionRepository.save(any(BiddingSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        biddingService.cancelSession(10L, 1L, "ROLE_FARMER");

        assertEquals(BiddingSessionStatus.CANCELLED, session.getStatus());
        assertEquals(BidStatus.CANCELLED, activeBid.getStatus());

        // Verify dealer 3 refund
        verify(paymentServiceClient, times(1)).creditWallet(argThat(creditReq ->
                creditReq.getUserId().equals(3L) &&
                creditReq.getAmount().compareTo(new BigDecimal("35.00")) == 0 &&
                "BID_REFUND".equals(creditReq.getTransactionType())
        ));
    }
}