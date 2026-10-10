package com.cropdeal.invoice.entity;

/*
 * Represents the current status of an invoice.
 *
 * Enum is used because the invoice status should contain
 * only predefined values.
 */
public enum InvoiceStatus {

    // Invoice record has been created but is not completed.
    PENDING,

    // Invoice details and PDF have been generated.
    GENERATED,

    // Invoice has been officially issued to the customer.
    ISSUED,

    // Invoice has been cancelled.
    CANCELLED
}