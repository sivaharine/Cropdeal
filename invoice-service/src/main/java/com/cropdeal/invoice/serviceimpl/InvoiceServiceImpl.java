package com.cropdeal.invoice.serviceimpl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cropdeal.invoice.dto.request.InvoiceCreateRequest;
import com.cropdeal.invoice.dto.request.InvoiceItemRequest;
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

/*
 * @Service tells Spring that this class contains
 * business logic and should be managed as a Spring bean.
 *
 * This class implements InvoiceService, so it must provide
 * the implementation of all methods declared in the interface.
 */
@Service
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    
    private final PdfInvoiceService pdfInvoiceService;

    private final InvoiceMapper invoiceMapper;


    /*
     * Constructor injection is used to inject dependencies.
     *
     * Spring automatically provides:
     * - InvoiceRepository
     * - InvoiceMapper
     *
     * Constructor injection is preferred because dependencies
     * become mandatory and the class is easier to test.
     */
    public InvoiceServiceImpl(
            InvoiceRepository invoiceRepository,
            InvoiceMapper invoiceMapper,
            PdfInvoiceService pdfInvoiceService
    ) {
        this.invoiceRepository = invoiceRepository;
        this.invoiceMapper = invoiceMapper;
        this.pdfInvoiceService = pdfInvoiceService;
    }


    /*
     * Creates and saves a new invoice.
     *
     * @Transactional means that all database operations
     * inside this method are treated as one transaction.
     *
     * If an error occurs while saving the invoice or its items,
     * the transaction will be rolled back.
     */
    @Override
    @Transactional
    public InvoiceResponse createInvoice(InvoiceCreateRequest request) {

        /*
         * Check whether an invoice already exists for this order.
         *
         * This protects the application from creating duplicate
         * invoices for the same order.
         */
        if (invoiceRepository.findByOrderId(request.getOrderId()).isPresent()) {

            throw new DuplicateInvoiceException(
                    "Invoice already exists for order ID: "
                            + request.getOrderId());
        }


        /*
         * Create a new Invoice entity.
         */
        Invoice invoice = new Invoice();

        /*
         * Generate a unique invoice number.
         */
        invoice.setInvoiceNumber(generateInvoiceNumber());

        /*
         * Copy basic data from the request into the entity.
         */
        invoice.setOrderId(request.getOrderId());
        invoice.setPaymentId(request.getPaymentId());
        invoice.setFarmerId(request.getFarmerId());
        invoice.setDealerId(request.getDealerId());

        /*
         * Set the invoice creation date and time.
         */
        LocalDateTime currentDateTime = LocalDateTime.now();

        invoice.setInvoiceDate(currentDateTime);
        invoice.setCreatedAt(currentDateTime);

        /*
         * Set the initial invoice status.
         *
         * At this stage, the invoice has been created,
         * but PDF generation has not yet been implemented.
         */
        invoice.setStatus(InvoiceStatus.GENERATED);


        /*
         * Calculate the invoice values from the items.
         *
         * We do not blindly trust subtotal and totalAmount
         * received from the request.
         */
        BigDecimal calculatedSubtotal = BigDecimal.ZERO;


        /*
         * Convert each request item into an entity.
         */
        for (InvoiceItemRequest itemRequest : request.getItems()) {

            /*
             * Convert the request DTO into an entity.
             */
            InvoiceItem item = invoiceMapper.toEntity(itemRequest);

            /*
             * Calculate:
             *
             * lineTotal = quantity × unitPrice
             */
            BigDecimal lineTotal = itemRequest.getQuantity()
                    .multiply(itemRequest.getUnitPrice())
                    .setScale(2, RoundingMode.HALF_UP);

            /*
             * Store the calculated line total.
             */
            item.setLineTotal(lineTotal);

            /*
             * Add the line total to the subtotal.
             */
            calculatedSubtotal = calculatedSubtotal
                    .add(lineTotal);

            /*
             * Add the item to the invoice.
             *
             * This also sets the invoice reference inside
             * the InvoiceItem entity.
             */
            invoice.addItem(item);
        }


        /*
         * Normalize the tax amount to two decimal places.
         */
        BigDecimal taxAmount = request.getTaxAmount()
                .setScale(2, RoundingMode.HALF_UP);


        /*
         * Calculate the final total:
         *
         * totalAmount = subtotal + taxAmount
         */
        BigDecimal calculatedTotal = calculatedSubtotal
                .add(taxAmount)
                .setScale(2, RoundingMode.HALF_UP);


        /*
         * Store the calculated financial values.
         */
        invoice.setSubtotal(calculatedSubtotal);
        invoice.setTaxAmount(taxAmount);
        invoice.setTotalAmount(calculatedTotal);


        /*
         * Save the invoice.
         *
         * Because Invoice uses CascadeType.ALL,
         * its InvoiceItem records will also be saved.
         */
        Invoice savedInvoice = invoiceRepository.save(invoice);


        /*
         * Convert the saved entity into a response DTO.
         */
        return invoiceMapper.toResponse(savedInvoice);
    }


    /*
     * Retrieves an invoice by its database ID.
     */
    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long id) {

        /*
         * findById() returns Optional<Invoice>.
         *
         * If the invoice does not exist, throw an exception.
         */
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invoice not found with ID: " + id));

        return invoiceMapper.toResponse(invoice);
    }


    /*
     * Retrieves an invoice by its invoice number.
     */
    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceByNumber(String invoiceNumber) {

        Invoice invoice = invoiceRepository
                .findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invoice not found with number: " + invoiceNumber));

        return invoiceMapper.toResponse(invoice);
    }


    /*
     * Retrieves an invoice using the related order ID.
     */
    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceByOrderId(Long orderId) {

        Invoice invoice = invoiceRepository
                .findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invoice not found for order ID: " + orderId));

        return invoiceMapper.toResponse(invoice);
    }


    /*
     * Retrieves all invoices.
     */
    @Override
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getAllInvoices() {

        /*
         * Fetch all invoice entities from the database.
         *
         * Then convert each entity into an InvoiceResponse DTO.
         */
        return invoiceRepository.findAll()
                .stream()
                .map(invoiceMapper::toResponse)
                .collect(Collectors.toList());
    }


    /*
     * Generates an invoice number.
     *
     * Example:
     *
     * INV-20260915-103015123
     *
     * The timestamp makes the number highly likely to be unique.
     *
     * For a production system, a database-backed sequence or
     * a stronger unique-number generation strategy is preferable.
     */
    private String generateInvoiceNumber() {

        DateTimeFormatter formatter =
                DateTimeFormatter.ofPattern("yyyyMMdd-HHmmssSSS");

        return "INV-" + LocalDateTime.now().format(formatter);
    }
    
    @Override
    @Transactional
    public InvoiceResponse updateInvoice(Long id, InvoiceCreateRequest request) {

        // Find the existing invoice or throw a 404 exception.
        Invoice existingInvoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invoice not found with ID: " + id
                ));

        /*
         * Check whether the requested order ID belongs to another invoice.
         * This prevents two invoices from having the same order ID.
         */
        invoiceRepository.findByOrderId(request.getOrderId())
                .ifPresent(invoice -> {
                    if (!invoice.getId().equals(id)) {
                        throw new DuplicateInvoiceException(
                                "Invoice already exists for order ID: "
                                        + request.getOrderId()
                        );
                    }
                });

        // Update the basic invoice information.
        existingInvoice.setOrderId(request.getOrderId());
        existingInvoice.setPaymentId(request.getPaymentId());
        existingInvoice.setFarmerId(request.getFarmerId());
        existingInvoice.setDealerId(request.getDealerId());
        existingInvoice.setTaxAmount(request.getTaxAmount());

        /*
         * Remove the old items.
         * orphanRemoval=true ensures that old invoice items are removed
         * from the database when the invoice is saved.
         */
        existingInvoice.getItems().clear();

        BigDecimal calculatedSubtotal = BigDecimal.ZERO;

        // Add the updated invoice items.
        for (InvoiceItemRequest itemRequest : request.getItems()) {

            InvoiceItem item = invoiceMapper.toEntity(itemRequest);

            BigDecimal lineTotal = itemRequest.getQuantity()
                    .multiply(itemRequest.getUnitPrice())
                    .setScale(2, RoundingMode.HALF_UP);

            item.setLineTotal(lineTotal);

            calculatedSubtotal = calculatedSubtotal.add(lineTotal);

            existingInvoice.addItem(item);
        }

        // Update calculated monetary values.
        calculatedSubtotal = calculatedSubtotal.setScale(
                2,
                RoundingMode.HALF_UP
        );

        BigDecimal calculatedTotal = calculatedSubtotal
                .add(request.getTaxAmount())
                .setScale(2, RoundingMode.HALF_UP);

        existingInvoice.setSubtotal(calculatedSubtotal);
        existingInvoice.setTotalAmount(calculatedTotal);

        // Save and return the updated invoice.
        Invoice updatedInvoice = invoiceRepository.save(existingInvoice);

        return invoiceMapper.toResponse(updatedInvoice);
    }

    @Override
    @Transactional
    public void deleteInvoice(Long id) {

        // Check whether the invoice exists before deleting it.
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invoice not found with ID: " + id
                ));

        // Delete the invoice and its associated items.
        invoiceRepository.delete(invoice);
    }
    
    /**
     * Finds an invoice by ID and generates its PDF document.
     */
    @Override
    @Transactional(readOnly = true)
    public byte[] generateInvoicePdf(Long id) {

        /*
         * Retrieve the invoice from the database.
         * If the invoice does not exist, the existing exception handler
         * will return HTTP 404 Not Found.
         */
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Invoice not found with ID: " + id
                        )
                );

        /*
         * Convert the invoice entity into PDF bytes.
         */
        return pdfInvoiceService.generateInvoicePdf(invoice);
    }
    
}