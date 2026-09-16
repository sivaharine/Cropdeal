package com.cropdeal.invoice.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import com.cropdeal.invoice.dto.request.InvoiceCreateRequest;
import com.cropdeal.invoice.dto.response.InvoiceResponse;
import com.cropdeal.invoice.service.InvoiceService;

import jakarta.validation.Valid;

/*
 * @RestController tells Spring that this class handles
 * REST API requests.
 *
 * It combines:
 *
 * @Controller
 * @ResponseBody
 *
 * Therefore, returned Java objects are automatically
 * converted into JSON responses.
 */
@RestController

/*
 * All endpoints in this controller begin with:
 *
 * /api/invoices
 *
 * Example:
 * /api/invoices/1
 */
@RequestMapping("/api/invoices")
public class InvoiceController {

    /*
     * Reference to the service interface.
     *
     * The controller calls the service layer instead of
     * directly accessing the repository.
     */
    private final InvoiceService invoiceService;


    /*
     * Constructor injection.
     *
     * Spring automatically injects the InvoiceService
     * implementation into this controller.
     */
    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }


    /*
     * =====================================================
     * CREATE INVOICE
     * =====================================================
     *
     * HTTP method:
     * POST
     *
     * URL:
     * /api/invoices
     *
     * Example request body:
     *
     * {
     *   "orderId": 1001,
     *   "paymentId": "PAY-2001",
     *   "farmerId": 10,
     *   "dealerId": 20,
     *   "items": [
     *     {
     *       "cropName": "Tomato",
     *       "quantity": 100,
     *       "unit": "kg",
     *       "unitPrice": 30
     *     }
     *   ],
     *   "subtotal": 3000,
     *   "taxAmount": 0,
     *   "totalAmount": 3000
     * }
     *
     * @Valid activates the validation annotations present
     * inside InvoiceCreateRequest and InvoiceItemRequest.
     */
    @PostMapping
    public ResponseEntity<InvoiceResponse> createInvoice(
            @Valid @RequestBody InvoiceCreateRequest request) {

        /*
         * Send the request to the service layer.
         *
         * The service layer will:
         * - Check duplicate orders
         * - Calculate item totals
         * - Calculate subtotal
         * - Calculate final amount
         * - Save the invoice
         */
        InvoiceResponse response = invoiceService.createInvoice(request);

        /*
         * Return HTTP 201 CREATED because a new invoice
         * has been created successfully.
         */
        return new ResponseEntity<>(
                response,
                HttpStatus.CREATED
        );
    }


    /*
     * =====================================================
     * GET INVOICE BY ID
     * =====================================================
     *
     * HTTP method:
     * GET
     *
     * URL:
     * /api/invoices/{id}
     *
     * Example:
     * /api/invoices/1
     */
    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getInvoiceById(
            @PathVariable Long id) {

        /*
         * @PathVariable reads the {id} value from the URL.
         */
        InvoiceResponse response = invoiceService.getInvoiceById(id);

        /*
         * Return HTTP 200 OK with the invoice JSON.
         */
        return ResponseEntity.ok(response);
    }


    /*
     * =====================================================
     * GET INVOICE BY INVOICE NUMBER
     * =====================================================
     *
     * HTTP method:
     * GET
     *
     * URL:
     * /api/invoices/number/{invoiceNumber}
     *
     * Example:
     * /api/invoices/number/INV-20260915-103015123
     */
    @GetMapping("/number/{invoiceNumber}")
    public ResponseEntity<InvoiceResponse> getInvoiceByNumber(
            @PathVariable String invoiceNumber) {

        /*
         * Search for the invoice using its public invoice number.
         */
        InvoiceResponse response =
                invoiceService.getInvoiceByNumber(invoiceNumber);

        return ResponseEntity.ok(response);
    }


    /*
     * =====================================================
     * GET INVOICE BY ORDER ID
     * =====================================================
     *
     * HTTP method:
     * GET
     *
     * URL:
     * /api/invoices/order/{orderId}
     *
     * Example:
     * /api/invoices/order/1001
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<InvoiceResponse> getInvoiceByOrderId(
            @PathVariable Long orderId) {

        /*
         * Find the invoice associated with the given order.
         */
        InvoiceResponse response =
                invoiceService.getInvoiceByOrderId(orderId);

        return ResponseEntity.ok(response);
    }


    /*
     * =====================================================
     * GET ALL INVOICES
     * =====================================================
     *
     * HTTP method:
     * GET
     *
     * URL:
     * /api/invoices
     *
     * This endpoint may later be restricted to administrators.
     */
    @GetMapping
    public ResponseEntity<List<InvoiceResponse>> getAllInvoices() {

        /*
         * Ask the service layer to retrieve all invoices.
         */
        List<InvoiceResponse> responses =
                invoiceService.getAllInvoices();

        return ResponseEntity.ok(responses);
    }
    
    /**
     * Updates an existing invoice.
     *
     * PUT /api/invoices/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<InvoiceResponse> updateInvoice(
            @PathVariable Long id,
            @Valid @RequestBody InvoiceCreateRequest request) {

        InvoiceResponse updatedInvoice =
                invoiceService.updateInvoice(id, request);

        return ResponseEntity.ok(updatedInvoice);
    }

    /**
     * Deletes an existing invoice.
     *
     * DELETE /api/invoices/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {

        invoiceService.deleteInvoice(id);

        return ResponseEntity.noContent().build();
    }
    
    /**
     * Generates and downloads an invoice as a PDF file.
     *
     * Example:
     * GET /api/invoices/1/pdf
     */
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long id) {

        /*
         * Generate the PDF content through the service layer.
         */
        byte[] pdfBytes = invoiceService.generateInvoicePdf(id);

        /*
         * Configure the response headers so that the browser or Swagger
         * treats the response as a PDF file.
         */
        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(MediaType.APPLICATION_PDF);

        headers.setContentDisposition(
                ContentDisposition.attachment()
                        .filename("invoice-" + id + ".pdf")
                        .build()
        );

        /*
         * Return the generated PDF with HTTP status 200 OK.
         */
        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}