package com.example.demo.service;

import com.example.demo.dto.NegotiationCreateRequest;
import com.example.demo.dto.NegotiationResponse;
import com.example.demo.dto.NegotiationStatusResponse;
import java.util.List;

public interface NegotiationService {

    NegotiationResponse createNegotiation(NegotiationCreateRequest request);

    NegotiationResponse getNegotiation(Long negotiationId);

    List<NegotiationResponse> getNegotiationsForUser(Long userId);

    NegotiationStatusResponse getStatus(Long negotiationId);

    NegotiationStatusResponse closeNegotiation(Long negotiationId);
}
