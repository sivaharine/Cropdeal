package com.example.demo.controller;

import com.example.demo.dto.CounterOfferRequest;
import com.example.demo.dto.NegotiationCreateRequest;
import com.example.demo.dto.NegotiationResponse;
import com.example.demo.dto.NegotiationStatusResponse;
import com.example.demo.dto.OfferRequest;
import com.example.demo.dto.OfferResponse;
import com.example.demo.service.NegotiationService;
import com.example.demo.service.OfferService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/negotiations")
public class NegotiationController {

    private final NegotiationService negotiationService;
    private final OfferService offerService;

    public NegotiationController(NegotiationService negotiationService, OfferService offerService) {
        this.negotiationService = negotiationService;
        this.offerService = offerService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NegotiationResponse createNegotiation(@Valid @RequestBody NegotiationCreateRequest request) {
        return negotiationService.createNegotiation(request);
    }

    @GetMapping("/{negotiationId}")
    public NegotiationResponse getNegotiation(@PathVariable Long negotiationId) {
        return negotiationService.getNegotiation(negotiationId);
    }

    @GetMapping("/users/{userId}")
    public List<NegotiationResponse> getNegotiationsForUser(@PathVariable Long userId) {
        return negotiationService.getNegotiationsForUser(userId);
    }

    @GetMapping("/{negotiationId}/status")
    public NegotiationStatusResponse getStatus(@PathVariable Long negotiationId) {
        return negotiationService.getStatus(negotiationId);
    }

    @PatchMapping("/{negotiationId}/close")
    public NegotiationStatusResponse closeNegotiation(@PathVariable Long negotiationId) {
        return negotiationService.closeNegotiation(negotiationId);
    }

    @PostMapping("/{negotiationId}/offers")
    @ResponseStatus(HttpStatus.CREATED)
    public OfferResponse createOffer(
            @PathVariable Long negotiationId,
            @Valid @RequestBody OfferRequest request
    ) {
        return offerService.createOffer(negotiationId, request);
    }

    @PostMapping("/{negotiationId}/counter-offers")
    @ResponseStatus(HttpStatus.CREATED)
    public OfferResponse createCounterOffer(
            @PathVariable Long negotiationId,
            @Valid @RequestBody CounterOfferRequest request
    ) {
        return offerService.createCounterOffer(negotiationId, request);
    }

    @PatchMapping("/offers/{offerId}/accept")
    public OfferResponse acceptOffer(@PathVariable Long offerId) {
        return offerService.acceptOffer(offerId);
    }

    @PatchMapping("/offers/{offerId}/reject")
    public OfferResponse rejectOffer(@PathVariable Long offerId) {
        return offerService.rejectOffer(offerId);
    }
}
