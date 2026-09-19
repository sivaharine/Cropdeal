package com.cropdeal.invoice.serviceimpl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cropdeal.invoice.dto.request.InvoiceCreateRequest;
import com.cropdeal.invoice.dto.request.InvoiceItemRequest;
import com.cropdeal.invoice.dto.request.InvoicePaymentRequest;
import com.cropdeal.invoice.dto.response.InvoiceResponse;
import com.cropdeal.invoice.entity.Invoice;
import com.cropdeal.invoice.entity.InvoiceItem;
import com.cropdeal.invoice.entity.InvoiceStatus;
import com.cropdeal.invoice.exception.DuplicateInvoiceException;
import com.cropdeal.invoice.exception.ResourceNotFoundException;
import com.cropdeal.invoice.mapper.InvoiceMapper;
import com.cropdeal.invoice.repository.InvoiceRepository;
import com.cropdeal.invoice.service.InvoiceService;
import com.cropdeal.invoice.service.PdfInvoiceService;

@Service
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final PdfInvoiceService pdfInvoiceService;
    private final InvoiceMapper invoiceMapper;

    public InvoiceServiceImpl(
            InvoiceRepository invoiceRepository,
            InvoiceMapper invoiceMapper,
            PdfInvoiceService pdfInvoiceService
    ) {
        this.invoiceRepository = invoiceRepository;
        this.invoiceMapper = invoiceMapper;
        this.pdfInvoiceService = pdfInvoiceService;
    }

    @Override
    @Transactional
    public InvoiceResponse createInvoice(InvoiceCreateRequest request) {
        if (invoiceRepository.findByOrderId(request.getOrderId()).isPresent()) {
            throw new DuplicateInvoiceException("Invoice already exists for order ID: " + request.getOrderId());
        }

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(generateInvoiceNumber());
        invoice.setOrderId(request.getOrderId());
        invoice.setPaymentId(request.getPaymentId());
        invoice.setFarmerId(request.getFarmerId());
        invoice.setDealerId(request.getDealerId());

        LocalDateTime currentDateTime = LocalDateTime.now();
        invoice.setInvoiceDate(currentDateTime);
        invoice.setCreatedAt(currentDateTime);
        invoice.setStatus(InvoiceStatus.GENERATED);

        BigDecimal calculatedSubtotal = BigDecimal.ZERO;

        if (request.getItems() != null) {
            for (InvoiceItemRequest itemRequest : request.getItems()) {
                InvoiceItem item = invoiceMapper.toEntity(itemRequest);
                BigDecimal lineTotal = itemRequest.getQuantity()
                        .multiply(itemRequest.getUnitPrice())
                        .setScale(2, RoundingMode.HALF_UP);
                item.setLineTotal(lineTotal);
                calculatedSubtotal = calculatedSubtotal.add(lineTotal);
                invoice.addItem(item);
            }
        }

        BigDecimal taxAmount = request.getTaxAmount() != null ? request.getTaxAmount().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal calculatedTotal = calculatedSubtotal.add(taxAmount).setScale(2, RoundingMode.HALF_UP);

        invoice.setSubtotal(calculatedSubtotal);
        invoice.setTaxAmount(taxAmount);
        invoice.setTotalAmount(calculatedTotal);

        Invoice savedInvoice = invoiceRepository.save(invoice);
        return invoiceMapper.toResponse(savedInvoice);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + id));
        return invoiceMapper.toResponse(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceByNumber(String invoiceNumber) {
        Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with number: " + invoiceNumber));
        return invoiceMapper.toResponse(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceByOrderId(Long orderId) {
        Invoice invoice = invoiceRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found for order ID: " + orderId));
        return invoiceMapper.toResponse(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAll().stream()
                .map(invoiceMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InvoiceResponse updateInvoice(Long id, InvoiceCreateRequest request) {
        Invoice existingInvoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + id));

        invoiceRepository.findByOrderId(request.getOrderId())
                .ifPresent(inv -> {
                    if (!inv.getId().equals(id)) {
                        throw new DuplicateInvoiceException("Invoice already exists for order ID: " + request.getOrderId());
                    }
                });

        existingInvoice.setOrderId(request.getOrderId());
        existingInvoice.setPaymentId(request.getPaymentId());
        existingInvoice.setFarmerId(request.getFarmerId());
        existingInvoice.setDealerId(request.getDealerId());
        existingInvoice.setTaxAmount(request.getTaxAmount());

        existingInvoice.getItems().clear();
        BigDecimal calculatedSubtotal = BigDecimal.ZERO;

        if (request.getItems() != null) {
            for (InvoiceItemRequest itemRequest : request.getItems()) {
                InvoiceItem item = invoiceMapper.toEntity(itemRequest);
                BigDecimal lineTotal = itemRequest.getQuantity()
                        .multiply(itemRequest.getUnitPrice())
                        .setScale(2, RoundingMode.HALF_UP);
                item.setLineTotal(lineTotal);
                calculatedSubtotal = calculatedSubtotal.add(lineTotal);
                existingInvoice.addItem(item);
            }
        }

        calculatedSubtotal = calculatedSubtotal.setScale(2, RoundingMode.HALF_UP);
        BigDecimal taxAmount = request.getTaxAmount() != null ? request.getTaxAmount().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal calculatedTotal = calculatedSubtotal.add(taxAmount).setScale(2, RoundingMode.HALF_UP);

        existingInvoice.setSubtotal(calculatedSubtotal);
        existingInvoice.setTotalAmount(calculatedTotal);

        Invoice updatedInvoice = invoiceRepository.save(existingInvoice);
        return invoiceMapper.toResponse(updatedInvoice);
    }

    @Override
    @Transactional
    public void deleteInvoice(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + id));
        invoiceRepository.delete(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] generateInvoicePdf(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + id));
        return pdfInvoiceService.generateInvoicePdf(invoice);
    }

    @Override
    @Transactional
    public InvoiceResponse generateInvoiceFromPayment(InvoicePaymentRequest request) {
        Optional<Invoice> existing = invoiceRepository.findByOrderId(request.getOrderId());
        if (existing.isPresent()) {
            return invoiceMapper.toResponse(existing.get());
        }

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(generateInvoiceNumber());
        invoice.setOrderId(request.getOrderId());
        if (request.getPaymentId() == null) {
            throw new IllegalArgumentException("Payment ID is required to generate an invoice");
        }
        invoice.setPaymentId(String.valueOf(request.getPaymentId()));
        invoice.setFarmerId(request.getFarmerId());
        invoice.setDealerId(request.getDealerId());

        LocalDateTime currentDateTime = LocalDateTime.now();
        invoice.setInvoiceDate(currentDateTime);
        invoice.setCreatedAt(currentDateTime);
        invoice.setStatus(InvoiceStatus.GENERATED);

        BigDecimal amount = request.getAmount() != null ? request.getAmount().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        invoice.setSubtotal(amount);
        invoice.setTaxAmount(BigDecimal.ZERO);
        invoice.setTotalAmount(amount);

        InvoiceItem item = new InvoiceItem();
        item.setCropName("Order #" + request.getOrderId() + " Crop");
        item.setQuantity(BigDecimal.ONE);
        item.setUnit("unit");
        item.setUnitPrice(amount);
        item.setLineTotal(amount);
        invoice.addItem(item);

        Invoice saved = invoiceRepository.save(invoice);
        return invoiceMapper.toResponse(saved);
    }

    private String generateInvoiceNumber() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmssSSS");
        return "INV-" + LocalDateTime.now().format(formatter);
    }
}