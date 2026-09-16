package com.cropdeal.invoice.service;

import java.util.List;

import com.cropdeal.invoice.dto.request.InvoiceCreateRequest;
import com.cropdeal.invoice.dto.response.InvoiceResponse;

/*
 * This interface defines the operations that the
 * Invoice Service can perform.
 *
 * It contains method declarations only.
 *
 * The actual business logic will be written in
 * InvoiceServiceImpl.
 */
public interface InvoiceService {

    /*
     * Creates a new invoice using the request data.
     *
     * @param request data received from the client
     * @return the newly created invoice response
     */
    InvoiceResponse createInvoice(InvoiceCreateRequest request);

    /*
     * Finds an invoice using its database ID.
     *
     * @param id invoice primary key
     * @return invoice response
     */
    InvoiceResponse getInvoiceById(Long id);

    /*
     * Finds an invoice using its invoice number.
     *
     * Example:
     * INV-20260915-0001
     *
     * @param invoiceNumber unique invoice number
     * @return invoice response
     */
    InvoiceResponse getInvoiceByNumber(String invoiceNumber);

    /*
     * Finds an invoice using the related order ID.
     *
     * @param orderId ID of the order
     * @return invoice response
     */
    InvoiceResponse getInvoiceByOrderId(Long orderId);

    /*
     * Returns all invoices.
     *
     * This method may later be restricted to admins.
     *
     * @return list of invoice responses
     */
    List<InvoiceResponse> getAllInvoices();
    
    /**
     * Updates an existing invoice.
     *
     * @param id      invoice database ID
     * @param request updated invoice details
     * @return updated invoice response
     */
    InvoiceResponse updateInvoice(Long id, InvoiceCreateRequest request);

    /**
     * Deletes an existing invoice.
     *
     * @param id invoice database ID
     */
    void deleteInvoice(Long id);
    
    /**
     * Retrieves an invoice and generates its PDF document.
     *
     * @param id invoice ID
     * @return generated PDF as byte array
     */
    byte[] generateInvoicePdf(Long id);
    
    
}