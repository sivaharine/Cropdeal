package com.example.demo.exception;

public class NegotiationNotFoundException extends RuntimeException {

    public NegotiationNotFoundException(Long negotiationId) {
        super("Negotiation not found with id: " + negotiationId);
    }
}
