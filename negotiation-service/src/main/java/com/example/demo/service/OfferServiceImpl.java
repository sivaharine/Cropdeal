package com.example.demo.service;

import com.example.demo.dto.CounterOfferRequest;
import com.example.demo.dto.OfferRequest;
import com.example.demo.dto.OfferResponse;
import com.example.demo.entity.Negotiation;
import com.example.demo.entity.NegotiationOffer;
import com.example.demo.entity.NegotiationStatus;
import com.example.demo.entity.OfferStatus;
import com.example.demo.exception.InvalidOfferException;
import com.example.demo.exception.NegotiationClosedException;
import com.example.demo.exception.NegotiationNotFoundException;
import com.example.demo.repository.NegotiationOfferRepository;
import com.example.demo.repository.NegotiationRepository;
import java.math.BigDecimal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class OfferServiceImpl implements OfferService {

    private final NegotiationRepository negotiationRepository;
    private final NegotiationOfferRepository offerRepository;

    public OfferServiceImpl(
            NegotiationRepository negotiationRepository,
            NegotiationOfferRepository offerRepository
    ) {
        this.negotiationRepository = negotiationRepository;
        this.offerRepository = offerRepository;
    }

    @Override
    public OfferResponse createOffer(Long negotiationId, OfferRequest request) {
        Negotiation negotiation = findOpenNegotiation(negotiationId);
        validateAmount(request.amount());

        NegotiationOffer offer = new NegotiationOffer();
        offer.setNegotiation(negotiation);
        offer.setOfferedByUserId(request.offeredByUserId());
        offer.setAmount(request.amount());
        offer.setMessage(request.message());
        offer.setStatus(OfferStatus.PENDING);

        return toResponse(offerRepository.save(offer));
    }

    @Override
    public OfferResponse createCounterOffer(Long negotiationId, CounterOfferRequest request) {
        Negotiation negotiation = findOpenNegotiation(negotiationId);
        validateAmount(request.amount());

        offerRepository.findByNegotiationIdOrderByCreatedAtAsc(negotiationId).stream()
                .filter(offer -> offer.getStatus() == OfferStatus.PENDING)
                .forEach(offer -> offer.setStatus(OfferStatus.COUNTERED));

        NegotiationOffer offer = new NegotiationOffer();
        offer.setNegotiation(negotiation);
        offer.setOfferedByUserId(request.offeredByUserId());
        offer.setAmount(request.amount());
        offer.setMessage(request.message());
        offer.setStatus(OfferStatus.PENDING);

        return toResponse(offerRepository.save(offer));
    }

    @Override
    public OfferResponse acceptOffer(Long offerId) {
        NegotiationOffer offer = findOffer(offerId);
        Negotiation negotiation = offer.getNegotiation();
        if (negotiation.getStatus() != NegotiationStatus.OPEN) {
            throw new NegotiationClosedException(negotiation.getId());
        }

        offer.setStatus(OfferStatus.ACCEPTED);
        negotiation.setStatus(NegotiationStatus.ACCEPTED);
        negotiationRepository.save(negotiation);
        return toResponse(offerRepository.save(offer));
    }

    @Override
    public OfferResponse rejectOffer(Long offerId) {
        NegotiationOffer offer = findOffer(offerId);
        Negotiation negotiation = offer.getNegotiation();
        if (negotiation.getStatus() != NegotiationStatus.OPEN) {
            throw new NegotiationClosedException(negotiation.getId());
        }

        offer.setStatus(OfferStatus.REJECTED);
        return toResponse(offerRepository.save(offer));
    }

    private Negotiation findOpenNegotiation(Long negotiationId) {
        Negotiation negotiation = negotiationRepository.findById(negotiationId)
                .orElseThrow(() -> new NegotiationNotFoundException(negotiationId));
        if (negotiation.getStatus() != NegotiationStatus.OPEN) {
            throw new NegotiationClosedException(negotiationId);
        }
        return negotiation;
    }

    private NegotiationOffer findOffer(Long offerId) {
        return offerRepository.findById(offerId)
                .orElseThrow(() -> new InvalidOfferException("Offer not found with id: " + offerId));
    }

    private void validateAmount(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new InvalidOfferException("Offer amount must be greater than zero");
        }
    }

    private OfferResponse toResponse(NegotiationOffer offer) {
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
