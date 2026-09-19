package com.cropdeal.invoice.dto.request;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/*
 * DTO used when creating a new invoice.
 *
 * This request may come from:
 *
 * - Order Service
 * - Payment Service
 * - API Gateway
 * - An internal admin operation
 */
public class InvoiceCreateRequest {

    /*
     * ID of the related order.
     */
    @NotNull(message = "Order ID is required")
    @Positive(message = "Order ID must be positive")
    private Long orderId;

    /*
     * Payment reference received from Payment Service.
     */
    @jakarta.validation.constraints.NotBlank(message = "Payment ID is required")
    private String paymentId;

    /*
     * ID of the farmer.
     */
    @NotNull(message = "Farmer ID is required")
    @Positive(message = "Farmer ID must be positive")
    private Long farmerId;

    /*
     * ID of the dealer.
     */
    @NotNull(message = "Dealer ID is required")
    @Positive(message = "Dealer ID must be positive")
    private Long dealerId;

    /*
     * List of crops included in the invoice.
     *
     * @NotEmpty ensures that at least one item is provided.
     *
     * @Valid tells Spring to validate each
     * InvoiceItemRequest object inside the list.
     */
    @NotEmpty(message = "At least one invoice item is required")
    @Valid
    private List<InvoiceItemRequest> items;

    /*
     * Subtotal before tax.
     */
    @NotNull(message = "Subtotal is required")
    @DecimalMin(value = "0.00", message = "Subtotal cannot be negative")
    private BigDecimal subtotal;

    /*
     * Tax amount.
     */
    @NotNull(message = "Tax amount is required")
    @DecimalMin(value = "0.00", message = "Tax amount cannot be negative")
    private BigDecimal taxAmount;

    /*
     * Final amount.
     *
     * The service layer should verify this value instead of
     * trusting the client blindly.
     */
    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.00", message = "Total amount cannot be negative")
    private BigDecimal totalAmount;


    // Default constructor required for JSON conversion.
    public InvoiceCreateRequest() {
    }


    // Getters and setters

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }

    public Long getFarmerId() {
        return farmerId;
    }

    public void setFarmerId(Long farmerId) {
        this.farmerId = farmerId;
    }

    public Long getDealerId() {
        return dealerId;
    }

    public void setDealerId(Long dealerId) {
        this.dealerId = dealerId;
    }

    public List<InvoiceItemRequest> getItems() {
        return items;
    }

    public void setItems(List<InvoiceItemRequest> items) {
        this.items = items;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
}