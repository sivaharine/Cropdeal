package com.cropdeal.invoice.exception;

/*
 * This exception is thrown when an invoice already exists
 * for the same order.
 *
 * This prevents accidental duplicate invoices.
 */
public class DuplicateInvoiceException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /*
     * Constructor receives the error message.
     */
    public DuplicateInvoiceException(String message) {
        super(message);
    }
}