package com.cropdeal.review.exception;

public class UnauthorizedReviewAccessException extends RuntimeException {
    public UnauthorizedReviewAccessException(String message) {
        super(message);
    }
}