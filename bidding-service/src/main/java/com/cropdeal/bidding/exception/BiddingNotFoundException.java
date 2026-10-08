package com.cropdeal.bidding.exception;

public class BiddingNotFoundException extends RuntimeException {
    public BiddingNotFoundException(Long id) {
        super("Bidding listing not found with id: " + id);
    }
}