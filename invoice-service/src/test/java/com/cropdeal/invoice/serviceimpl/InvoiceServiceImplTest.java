
package com.cropdeal.invoice.serviceimpl;

import com.cropdeal.invoice.dto.request.InvoiceCreateRequest;
import com.cropdeal.invoice.dto.request.InvoiceItemRequest;
import com.cropdeal.invoice.dto.response.InvoiceResponse;
import com.cropdeal.invoice.entity.Invoice;
import com.cropdeal.invoice.entity.InvoiceItem;
import com.cropdeal.invoice.exception.DuplicateInvoiceException;
import com.cropdeal.invoice.exception.ResourceNotFoundException;
import com.cropdeal.invoice.mapper.InvoiceMapper;
import com.cropdeal.invoice.repository.InvoiceRepository;
import com.cropdeal.invoice.service.PdfInvoiceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceImplTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private InvoiceMapper invoiceMapper;

    @Mock
    private PdfInvoiceService pdfInvoiceService;

    @InjectMocks
    private InvoiceServiceImpl invoiceService;

    private InvoiceCreateRequest request;
    private Invoice invoice;
    private InvoiceResponse response;

    @BeforeEach
    void setUp() {
        request = new InvoiceCreateRequest();

        request.setOrderId(1002L);
        request.setPaymentId("5002");
        request.setFarmerId(2002L);
        request.setDealerId(3002L);
        request.setTaxAmount(new BigDecimal("50.00"));

        InvoiceItemRequest item = new InvoiceItemRequest();
        item.setCropName("Rice");
        item.setQuantity(new BigDecimal("10"));
        item.setUnit("KG");
        item.setUnitPrice(new BigDecimal("50.00"));

        request.setItems(List.of(item));

        invoice = new Invoice();
        invoice.setId(2L);
        invoice.setOrderId(1002L);

        response = new InvoiceResponse();
    }

    @Test
    void createInvoice_ShouldCreateInvoiceSuccessfully() {
        InvoiceItem mappedItem = new InvoiceItem();

        when(invoiceRepository.findByOrderId(1002L))
                .thenReturn(Optional.empty());

        when(invoiceMapper.toEntity(any(InvoiceItemRequest.class)))
                .thenReturn(mappedItem);

        when(invoiceRepository.save(any(Invoice.class)))
                .thenReturn(invoice);

        when(invoiceMapper.toResponse(invoice))
                .thenReturn(response);

        InvoiceResponse result = invoiceService.createInvoice(request);

        assertNotNull(result);

        verify(invoiceRepository)
                .findByOrderId(1002L);

        verify(invoiceMapper)
                .toEntity(any(InvoiceItemRequest.class));

        verify(invoiceRepository)
                .save(any(Invoice.class));

        verify(invoiceMapper)
                .toResponse(invoice);
    }

    @Test
    void createInvoice_ShouldThrowException_WhenOrderAlreadyExists() {
        when(invoiceRepository.findByOrderId(1002L))
                .thenReturn(Optional.of(invoice));

        assertThrows(
                DuplicateInvoiceException.class,
                () -> invoiceService.createInvoice(request)
        );

        verify(invoiceRepository, never())
                .save(any(Invoice.class));
    }

    @Test
    void getInvoiceById_ShouldReturnInvoice_WhenIdExists() {
        when(invoiceRepository.findById(2L))
                .thenReturn(Optional.of(invoice));

        when(invoiceMapper.toResponse(invoice))
                .thenReturn(response);

        InvoiceResponse result = invoiceService.getInvoiceById(2L);

        assertNotNull(result);

        verify(invoiceRepository).findById(2L);
        verify(invoiceMapper).toResponse(invoice);
    }

    @Test
    void getInvoiceById_ShouldThrowException_WhenIdDoesNotExist() {
        when(invoiceRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> invoiceService.getInvoiceById(999L)
        );

        verify(invoiceMapper, never()).toResponse(any());
    }

    @Test
    void deleteInvoice_ShouldDeleteInvoice_WhenIdExists() {
        when(invoiceRepository.findById(2L))
                .thenReturn(Optional.of(invoice));

        invoiceService.deleteInvoice(2L);

        verify(invoiceRepository).findById(2L);
        verify(invoiceRepository).delete(invoice);
    }

    @Test
    void deleteInvoice_ShouldThrowException_WhenIdDoesNotExist() {
        when(invoiceRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> invoiceService.deleteInvoice(999L)
        );

        verify(invoiceRepository, never()).delete(any(Invoice.class));
    }

    @Test
    void generateInvoicePdf_ShouldReturnPdfBytes() {
        byte[] expectedPdf = "PDF content".getBytes();

        when(invoiceRepository.findById(2L))
                .thenReturn(Optional.of(invoice));

        when(pdfInvoiceService.generateInvoicePdf(invoice))
                .thenReturn(expectedPdf);

        byte[] result = invoiceService.generateInvoicePdf(2L);

        assertArrayEquals(expectedPdf, result);

        verify(invoiceRepository).findById(2L);
        verify(pdfInvoiceService).generateInvoicePdf(invoice);
    }

    @Test
    void generateInvoicePdf_ShouldThrowException_WhenInvoiceDoesNotExist() {
        when(invoiceRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> invoiceService.generateInvoicePdf(999L)
        );

        verify(pdfInvoiceService, never())
                .generateInvoicePdf(any(Invoice.class));
    }
}