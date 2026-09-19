package com.example.demo.service;

import com.example.demo.dto.NegotiationCreateRequest;
import com.example.demo.dto.NegotiationResponse;
import com.example.demo.dto.NegotiationStatusResponse;
import com.example.demo.dto.OfferResponse;
import com.example.demo.entity.Negotiation;
import com.example.demo.entity.NegotiationOffer;
import com.example.demo.entity.NegotiationStatus;
import com.example.demo.exception.NegotiationClosedException;
import com.example.demo.exception.NegotiationNotFoundException;
import com.example.demo.repository.NegotiationOfferRepository;
import com.example.demo.repository.NegotiationRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NegotiationServiceImpl implements NegotiationService {

    private final NegotiationRepository negotiationRepository;
    private final NegotiationOfferRepository offerRepository;

    public NegotiationServiceImpl(
            NegotiationRepository negotiationRepository,
            NegotiationOfferRepository offerRepository
    ) {
        this.negotiationRepository = negotiationRepository;
        this.offerRepository = offerRepository;
    }

    @Override
    public NegotiationResponse createNegotiation(NegotiationCreateRequest request) {
        Negotiation negotiation = new Negotiation();
        negotiation.setCropId(request.cropId());
        negotiation.setBuyerId(request.buyerId());
        negotiation.setSellerId(request.sellerId());
        negotiation.setQuantity(request.quantity());
        negotiation.setTargetPrice(request.targetPrice());
        negotiation.setStatus(NegotiationStatus.OPEN);
        return toResponse(negotiationRepository.save(negotiation));
    }

    @Override
    @Transactional(readOnly = true)
    public NegotiationResponse getNegotiation(Long negotiationId) {
        return toResponse(findNegotiation(negotiationId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NegotiationResponse> getNegotiationsForUser(Long userId) {
        return negotiationRepository.findByBuyerIdOrSellerId(userId, userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public NegotiationStatusResponse getStatus(Long negotiationId) {
        Negotiation negotiation = findNegotiation(negotiationId);
        return new NegotiationStatusResponse(negotiation.getId(), negotiation.getStatus());
    }

    @Override
    public NegotiationStatusResponse closeNegotiation(Long negotiationId) {
        Negotiation negotiation = findNegotiation(negotiationId);
        if (negotiation.getStatus() != NegotiationStatus.OPEN) {
            throw new NegotiationClosedException(negotiationId);
        }
        negotiation.setStatus(NegotiationStatus.CLOSED);
        Negotiation savedNegotiation = negotiationRepository.save(negotiation);
        return new NegotiationStatusResponse(savedNegotiation.getId(), savedNegotiation.getStatus());
    }

    private Negotiation findNegotiation(Long negotiationId) {
        return negotiationRepository.findById(negotiationId)
                .orElseThrow(() -> new NegotiationNotFoundException(negotiationId));
    }

    private NegotiationResponse toResponse(Negotiation negotiation) {
        List<OfferResponse> offers = offerRepository.findByNegotiationIdOrderByCreatedAtAsc(negotiation.getId()).stream()
                .map(this::toOfferResponse)
                .toList();

        return new NegotiationResponse(
                negotiation.getId(),
                negotiation.getCropId(),
                negotiation.getBuyerId(),
                negotiation.getSellerId(),
                negotiation.getQuantity(),
                negotiation.getTargetPrice(),
                negotiation.getStatus(),
                negotiation.getCreatedAt(),
                negotiation.getUpdatedAt(),
                offers
        );
    }

    private OfferResponse toOfferResponse(NegotiationOffer offer) {
        return new OfferResponse(
                offer.getId(),
                offer.getNegotiation().getId(),
                offer.getOfferedByUserId(),
                offer.getAmount(),
                offer.getMessage(),
                offer.getStatus(),
                offer.getCreatedAt()
        );
    }
}
