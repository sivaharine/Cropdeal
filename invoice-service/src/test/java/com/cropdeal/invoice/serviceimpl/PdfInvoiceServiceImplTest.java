package com.cropdeal.invoice.serviceimpl;

import com.cropdeal.invoice.entity.Invoice;
import com.cropdeal.invoice.entity.InvoiceItem;
import com.cropdeal.invoice.entity.InvoiceStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PdfInvoiceServiceImplTest {

    private PdfInvoiceServiceImpl pdfInvoiceService;

    @BeforeEach
    void setUp() {
        pdfInvoiceService = new PdfInvoiceServiceImpl();
    }

    @Test
    void testGenerateInvoicePdf_Success() {
        Invoice invoice = new Invoice();
        invoice.setId(101L);
        invoice.setInvoiceNumber("INV-20260918-001");
        invoice.setOrderId(1001L);
        invoice.setPaymentId("PAY-1001");
        invoice.setFarmerId(10L);
        invoice.setDealerId(20L);
        invoice.setInvoiceDate(LocalDateTime.now());
        invoice.setStatus(InvoiceStatus.GENERATED);
        invoice.setSubtotal(new BigDecimal("500.00"));
        invoice.setTaxAmount(BigDecimal.ZERO);
        invoice.setTotalAmount(new BigDecimal("500.00"));

        InvoiceItem item = new InvoiceItem();
        item.setId(1L);
        item.setCropName("Organic Wheat");
        item.setQuantity(new BigDecimal("5"));
        item.setUnit("kg");
        item.setUnitPrice(new BigDecimal("100.00"));
        item.setLineTotal(new BigDecimal("500.00"));
        invoice.addItem(item);

        byte[] pdfBytes = pdfInvoiceService.generateInvoicePdf(invoice);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);

        // Verify PDF Magic Bytes %PDF-
        String header = new String(pdfBytes, 0, 5, StandardCharsets.US_ASCII);
        assertEquals("%PDF-", header, "Generated file must start with %PDF- header");
    }

    @Test
    void testGenerateInvoicePdf_NullFieldsSafety() {
        Invoice invoice = new Invoice();
        invoice.setId(102L);
        invoice.setInvoiceNumber("INV-20260918-002");
        invoice.setOrderId(1002L);
        // invoiceDate is null
        invoice.setInvoiceDate(null);
        // items is empty
        invoice.setItems(new ArrayList<>());
        invoice.setSubtotal(null);
        invoice.setTotalAmount(new BigDecimal("200.00"));
        invoice.setStatus(null);

        byte[] pdfBytes = pdfInvoiceService.generateInvoicePdf(invoice);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);

        String header = new String(pdfBytes, 0, 5, StandardCharsets.US_ASCII);
        assertEquals("%PDF-", header, "Generated file must start with %PDF- header even with null fields");
    }
}
