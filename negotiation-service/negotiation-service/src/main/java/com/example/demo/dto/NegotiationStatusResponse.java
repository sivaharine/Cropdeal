package com.example.demo.dto;

import com.example.demo.entity.NegotiationStatus;

public record NegotiationStatusResponse(
        Long negotiationId,
        NegotiationStatus status
) {
}
