package com.example.demo.service;

import com.example.demo.dto.CounterOfferRequest;
import com.example.demo.dto.OfferRequest;
import com.example.demo.dto.OfferResponse;

public interface OfferService {

    OfferResponse createOffer(Long negotiationId, OfferRequest request);

    OfferResponse createCounterOffer(Long negotiationId, CounterOfferRequest request);

    OfferResponse acceptOffer(Long offerId);

    OfferResponse rejectOffer(Long offerId);
}
