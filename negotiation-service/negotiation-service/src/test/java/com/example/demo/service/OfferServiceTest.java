package com.example.demo.service;

import com.example.demo.dto.CounterOfferRequest;
import com.example.demo.dto.OfferRequest;
import com.example.demo.dto.OfferResponse;
import com.example.demo.entity.Negotiation;
import com.example.demo.entity.NegotiationOffer;
import com.example.demo.entity.NegotiationStatus;
import com.example.demo.entity.OfferStatus;
import com.example.demo.repository.NegotiationOfferRepository;
import com.example.demo.repository.NegotiationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OfferServiceTest {

    @Mock
    private NegotiationRepository negotiationRepository;

    @Mock
    private NegotiationOfferRepository offerRepository;

    @InjectMocks
    private OfferServiceImpl offerService;

    @Test
    @DisplayName("Create offer in open negotiation succeeds")
    void testCreateOffer() {
        Negotiation negotiation = new Negotiation();
        negotiation.setId(1L);
        negotiation.setStatus(NegotiationStatus.OPEN);

        OfferRequest req = new OfferRequest(20L, new BigDecimal("90.00"), "First offer");

        when(negotiationRepository.findById(1L)).thenReturn(Optional.of(negotiation));
        when(offerRepository.save(any(NegotiationOffer.class))).thenAnswer(i -> {
            NegotiationOffer o = i.getArgument(0);
            o.setId(100L);
            return o;
        });

        OfferResponse res = offerService.createOffer(1L, req);
        assertNotNull(res);
        assertEquals(OfferStatus.PENDING, res.status());
        assertEquals(new BigDecimal("90.00"), res.amount());
    }

    @Test
    @DisplayName("Accept offer marks offer ACCEPTED and negotiation ACCEPTED")
    void testAcceptOffer() {
        Negotiation negotiation = new Negotiation();
        negotiation.setId(1L);
        negotiation.setStatus(NegotiationStatus.OPEN);

        NegotiationOffer pendingOffer = new NegotiationOffer();
        pendingOffer.setId(100L);
        pendingOffer.setNegotiation(negotiation);
        pendingOffer.setStatus(OfferStatus.PENDING);
        pendingOffer.setAmount(new BigDecimal("95.00"));
        pendingOffer.setOfferedByUserId(20L);

        when(offerRepository.findById(100L)).thenReturn(Optional.of(pendingOffer));
        when(offerRepository.save(any(NegotiationOffer.class))).thenAnswer(i -> i.getArgument(0));
        when(negotiationRepository.save(any(Negotiation.class))).thenAnswer(i -> i.getArgument(0));

        OfferResponse res = offerService.acceptOffer(100L);
        assertNotNull(res);
        assertEquals(OfferStatus.ACCEPTED, res.status());
        assertEquals(NegotiationStatus.ACCEPTED, negotiation.getStatus());
    }

    @Test
    @DisplayName("Reject offer marks offer REJECTED")
    void testRejectOffer() {
        Negotiation negotiation = new Negotiation();
        negotiation.setId(1L);
        negotiation.setStatus(NegotiationStatus.OPEN);

        NegotiationOffer pendingOffer = new NegotiationOffer();
        pendingOffer.setId(100L);
        pendingOffer.setNegotiation(negotiation);
        pendingOffer.setStatus(OfferStatus.PENDING);

        when(offerRepository.findById(100L)).thenReturn(Optional.of(pendingOffer));
        when(offerRepository.save(any(NegotiationOffer.class))).thenAnswer(i -> i.getArgument(0));

        OfferResponse res = offerService.rejectOffer(100L);
        assertNotNull(res);
        assertEquals(OfferStatus.REJECTED, res.status());
    }
}
