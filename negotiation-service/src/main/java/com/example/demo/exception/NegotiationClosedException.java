package com.example.demo.exception;

public class NegotiationClosedException extends RuntimeException {

    public NegotiationClosedException(Long negotiationId) {
        super("Negotiation is already closed: " + negotiationId);
    }
}
