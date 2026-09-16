package com.cropdeal.invoice.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/*
 * Represents one crop item inside an invoice.
 *
 * Example:
 *
 * Crop name : Tomato
 * Quantity  : 100
 * Unit      : kg
 * Unit price: 30.00
 * Line total: 3000.00
 */
@Entity
@Table(name = "invoice_items")
public class InvoiceItem {

    /*
     * Primary key of the invoice_items table.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Many invoice items belong to one invoice.
     *
     * @ManyToOne creates the relationship between
     * invoice_items and invoices.
     *
     * LAZY means that the parent invoice is loaded only
     * when it is accessed.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    /*
     * Name of the crop purchased.
     *
     * Example:
     * Tomato
     * Potato
     * Onion
     */
    @Column(name = "crop_name", nullable = false)
    private String cropName;

    /*
     * Quantity of the crop purchased.
     *
     * BigDecimal is used because the quantity may contain
     * decimal values such as 2.5 kg.
     */
    @Column(name = "quantity", precision = 15, scale = 3, nullable = false)
    private BigDecimal quantity;

    /*
     * Measurement unit of the crop.
     *
     * Examples:
     * kg
     * ton
     * quintal
     */
    @Column(name = "unit", nullable = false)
    private String unit;

    /*
     * Price of one unit of the crop.
     */
    @Column(name = "unit_price", precision = 15, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    /*
     * Total price for this particular item.
     *
     * Formula:
     *
     * lineTotal = quantity * unitPrice
     *
     * This value should be calculated and validated by the
     * service layer rather than blindly trusting client input.
     */
    @Column(name = "line_total", precision = 15, scale = 2, nullable = false)
    private BigDecimal lineTotal;


    /*
     * Default constructor required by JPA.
     */
    public InvoiceItem() {
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

    public Invoice getInvoice() {
        return invoice;
    }

    public void setInvoice(Invoice invoice) {
        this.invoice = invoice;
    }

    public String getCropName() {
        return cropName;
    }

    public void setCropName(String cropName) {
        this.cropName = cropName;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(BigDecimal lineTotal) {
        this.lineTotal = lineTotal;
    }
}