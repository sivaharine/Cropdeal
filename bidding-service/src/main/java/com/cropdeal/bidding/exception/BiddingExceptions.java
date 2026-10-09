package com.cropdeal.bidding.exception;

public class BiddingExceptions {

    public static class InvalidBidException extends RuntimeException {
        public InvalidBidException(String message) { super(message); }
    }

    public static class InsufficientWalletBalanceException extends RuntimeException {
        public InsufficientWalletBalanceException(String message) { super(message); }
    }

    public static class SessionClosedException extends RuntimeException {
        public SessionClosedException(String message) { super(message); }
    }

    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) { super(message); }
    }

    public static class UnauthorizedAccessException extends RuntimeException {
        public UnauthorizedAccessException(String message) { super(message); }
    }
}