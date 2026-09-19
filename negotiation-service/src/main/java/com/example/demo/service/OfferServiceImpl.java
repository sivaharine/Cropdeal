package com.example.demo.service;

import com.example.demo.config.NotificationRabbitConfig;
import com.example.demo.dto.CounterOfferRequest;
import com.example.demo.dto.NegotiationAcceptedEvent;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class OfferServiceImpl implements OfferService {

    private static final Logger log = LoggerFactory.getLogger(OfferServiceImpl.class);

    private final NegotiationRepository negotiationRepository;
    private final NegotiationOfferRepository offerRepository;
    private final RabbitTemplate rabbitTemplate;

    public OfferServiceImpl(
            NegotiationRepository negotiationRepository,
            NegotiationOfferRepository offerRepository,
            RabbitTemplate rabbitTemplate
    ) {
        this.negotiationRepository = negotiationRepository;
        this.offerRepository = offerRepository;
        this.rabbitTemplate = rabbitTemplate;
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
        NegotiationOffer savedOffer = offerRepository.save(offer);
        publishNegotiationAccepted(negotiation, savedOffer);
        return toResponse(savedOffer);
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

    private void publishNegotiationAccepted(Negotiation negotiation, NegotiationOffer offer) {
        try {
            NegotiationAcceptedEvent event = new NegotiationAcceptedEvent(
                    negotiation.getId(),
                    offer.getId(),
                    negotiation.getBuyerId(),
                    negotiation.getSellerId(),
                    offer.getAmount(),
                    offer.getMessage()
            );

            rabbitTemplate.convertAndSend(
                    NotificationRabbitConfig.NOTIFICATION_EXCHANGE,
                    NotificationRabbitConfig.NEGOTIATION_ACCEPTED_ROUTING_KEY,
                    event
            );
        } catch (Exception e) {
            log.warn("Failed to publish negotiation accepted notification for negotiation {}: {}",
                    negotiation.getId(), e.getMessage());
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
