package com.cropdeal.invoice.exception;

/*
 * This exception is thrown when the requested invoice
 * does not exist in the database.
 *
 * Example:
 * The client requests invoice ID 100,
 * but invoice ID 100 is not available.
 */
public class ResourceNotFoundException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /*
     * Constructor receives the error message.
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }
}