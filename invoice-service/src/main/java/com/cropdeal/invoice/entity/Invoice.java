package com.cropdeal.invoice.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

/*
 * @Entity tells JPA that this class represents a database table.
 *
 * By default, the table name is based on the class name.
 * Here, we explicitly use the table name "invoices".
 */
@Entity
@Table(name = "invoices")
public class Invoice {

    /*
     * Primary key of the invoice table.
     *
     * IDENTITY means that MySQL will automatically generate
     * the ID using its auto-increment feature.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * A unique invoice number shown to the customer.
     *
     * Example:
     * INV-20260915-0001
     */
    @Column(name = "invoice_number", nullable = false, unique = true)
    private String invoiceNumber;

    /*
     * ID of the order received from the Order Service.
     *
     * We store only the order ID here.
     * We do not create a direct database relationship with
     * the Order Service database because each microservice
     * should own its own database.
     */
    @Column(name = "order_id", nullable = false, unique = true)
    private Long orderId;

    /*
     * Payment ID received from the Payment Service.
     *
     * String is used because payment systems may use values
     * such as PAY-1001 instead of numeric IDs.
     */
    @Column(name = "payment_id", nullable = false)
    private String paymentId;

    /*
     * ID of the farmer who supplied the crop.
     */
    @Column(name = "farmer_id", nullable = false)
    private Long farmerId;

    /*
     * ID of the dealer who purchased the crop.
     */
    @Column(name = "dealer_id", nullable = false)
    private Long dealerId;

    /*
     * Date and time when the invoice was generated.
     */
    @Column(name = "invoice_date", nullable = false)
    private LocalDateTime invoiceDate;

    /*
     * Total amount before tax or additional charges.
     *
     * BigDecimal is preferred for money because it provides
     * accurate decimal calculations.
     *
     * Do not use double for financial values.
     */
    @Column(name = "subtotal", precision = 15, scale = 2, nullable = false)
    private BigDecimal subtotal;

    /*
     * Tax amount applied to the invoice.
     *
     * Example:
     * 18.50
     */
    @Column(name = "tax_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal taxAmount;

    /*
     * Final invoice amount.
     *
     * Usually:
     *
     * totalAmount = subtotal + taxAmount
     */
    @Column(name = "total_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    /*
     * Stores the invoice status as text in the database.
     *
     * Example:
     * PENDING
     * GENERATED
     * ISSUED
     * CANCELLED
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private InvoiceStatus status;

    /*
     * Location of the generated PDF file.
     *
     * Example:
     * invoices/INV-20260915-0001.pdf
     *
     * This field can remain null until the PDF is generated.
     */
    @Column(name = "pdf_path")
    private String pdfPath;

    /*
     * Date and time when the invoice record was created.
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /*
     * One invoice can contain many invoice items.
     *
     * mappedBy = "invoice"
     * --------------------------------
     * The InvoiceItem class owns the relationship through
     * its "invoice" field.
     *
     * cascade = CascadeType.ALL
     * --------------------------------
     * Saving an Invoice also saves its InvoiceItems.
     *
     * orphanRemoval = true
     * --------------------------------
     * If an item is removed from the invoice item list,
     * JPA can remove that item from the database.
     *
     * fetch = FetchType.LAZY
     * --------------------------------
     * Invoice items are loaded only when required.
     */
    @OneToMany(
        mappedBy = "invoice",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    private List<InvoiceItem> items = new ArrayList<>();


    /*
     * Default constructor required by JPA.
     */
    public Invoice() {
    }


    /*
     * Adds one item to this invoice.
     *
     * We set both sides of the relationship:
     *
     * 1. Add the item to the invoice's item list.
     * 2. Set this invoice inside the InvoiceItem object.
     */
    public void addItem(InvoiceItem item) {
        items.add(item);
        item.setInvoice(this);
    }


    /*
     * Removes one item from this invoice.
     */
    public void removeItem(InvoiceItem item) {
        items.remove(item);
        item.setInvoice(null);
    }


    // =========================
    // GETTERS AND SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

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

    public LocalDateTime getInvoiceDate() {
        return invoiceDate;
    }

    public void setInvoiceDate(LocalDateTime invoiceDate) {
        this.invoiceDate = invoiceDate;
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

    public InvoiceStatus getStatus() {
        return status;
    }

    public void setStatus(InvoiceStatus status) {
        this.status = status;
    }

    public String getPdfPath() {
        return pdfPath;
    }

    public void setPdfPath(String pdfPath) {
        this.pdfPath = pdfPath;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<InvoiceItem> getItems() {
        return items;
    }

    public void setItems(List<InvoiceItem> items) {
        this.items = items;
    }
}