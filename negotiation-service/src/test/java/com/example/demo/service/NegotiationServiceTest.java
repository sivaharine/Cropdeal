package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.entity.*;
import com.example.demo.exception.NegotiationClosedException;
import com.example.demo.exception.NegotiationNotFoundException;
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
class NegotiationServiceTest {

    @Mock
    private NegotiationRepository negotiationRepository;

    @Mock
    private NegotiationOfferRepository offerRepository;

    @InjectMocks
    private NegotiationServiceImpl negotiationService;

    @Test
    @DisplayName("Create negotiation sets OPEN status")
    void testCreateNegotiation() {
        NegotiationCreateRequest req = new NegotiationCreateRequest(10L, 20L, 30L, new BigDecimal("50.0"), new BigDecimal("100.00"));

        when(negotiationRepository.save(any(Negotiation.class))).thenAnswer(invocation -> {
            Negotiation n = invocation.getArgument(0);
            n.setId(1L);
            return n;
        });

        NegotiationResponse res = negotiationService.createNegotiation(req);
        assertNotNull(res);
        assertEquals(NegotiationStatus.OPEN, res.status());
        assertEquals(10L, res.cropId());
    }

    @Test
    @DisplayName("Get negotiation by ID returns details")
    void testGetNegotiation() {
        Negotiation n = new Negotiation();
        n.setId(1L);
        n.setCropId(10L);
        n.setBuyerId(20L);
        n.setSellerId(30L);
        n.setQuantity(new BigDecimal("50.0"));
        n.setTargetPrice(new BigDecimal("100.00"));
        n.setStatus(NegotiationStatus.OPEN);

        when(negotiationRepository.findById(1L)).thenReturn(Optional.of(n));

        NegotiationResponse res = negotiationService.getNegotiation(1L);
        assertNotNull(res);
        assertEquals(1L, res.id());
    }

    @Test
    @DisplayName("Close negotiation updates status to CLOSED")
    void testCloseNegotiation() {
        Negotiation n = new Negotiation();
        n.setId(1L);
        n.setStatus(NegotiationStatus.OPEN);

        when(negotiationRepository.findById(1L)).thenReturn(Optional.of(n));
        when(negotiationRepository.save(any(Negotiation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NegotiationStatusResponse res = negotiationService.closeNegotiation(1L);
        assertEquals(NegotiationStatus.CLOSED, res.status());
    }

    @Test
    @DisplayName("Close already closed negotiation throws NegotiationClosedException")
    void testCloseAlreadyClosedNegotiation() {
        Negotiation n = new Negotiation();
        n.setId(1L);
        n.setStatus(NegotiationStatus.CLOSED);

        when(negotiationRepository.findById(1L)).thenReturn(Optional.of(n));

        assertThrows(NegotiationClosedException.class, () -> negotiationService.closeNegotiation(1L));
    }
}
