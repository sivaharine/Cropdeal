package com.cropdeal.invoice.service;

import com.cropdeal.invoice.entity.Invoice;

/**
 * Service responsible for generating PDF documents for invoices.
 */
public interface PdfInvoiceService {

    /**
     * Generates a PDF document for the supplied invoice.
     *
     * @param invoice invoice data to be converted into PDF
     * @return PDF document as a byte array
     */
    byte[] generateInvoicePdf(Invoice invoice);
}