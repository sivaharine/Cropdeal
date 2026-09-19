package com.cropdeal.invoice.service;

import java.util.List;

import com.cropdeal.invoice.dto.request.InvoiceCreateRequest;
import com.cropdeal.invoice.dto.request.InvoicePaymentRequest;
import com.cropdeal.invoice.dto.response.InvoiceResponse;

public interface InvoiceService {

    InvoiceResponse createInvoice(InvoiceCreateRequest request);

    InvoiceResponse getInvoiceById(Long id);

    InvoiceResponse getInvoiceByNumber(String invoiceNumber);

    InvoiceResponse getInvoiceByOrderId(Long orderId);

    List<InvoiceResponse> getAllInvoices();

    InvoiceResponse updateInvoice(Long id, InvoiceCreateRequest request);

    void deleteInvoice(Long id);

    byte[] generateInvoicePdf(Long id);

    InvoiceResponse generateInvoiceFromPayment(InvoicePaymentRequest request);
}