package com.cropdeal.invoice.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/*
 * This DTO receives one crop item from the client or
 * from another microservice.
 *
 * Example:
 *
 * {
 *   "cropName": "Tomato",
 *   "quantity": 100,
 *   "unit": "kg",
 *   "unitPrice": 30
 * }
 */
public class InvoiceItemRequest {

    /*
     * Name of the crop.
     *
     * @NotBlank prevents null, empty, or whitespace-only values.
     */
    @NotBlank(message = "Crop name is required")
    private String cropName;

    /*
     * Quantity of the crop.
     *
     * Example:
     * 100 kg
     * 2.5 ton
     */
    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.001", message = "Quantity must be greater than zero")
    private BigDecimal quantity;

    /*
     * Unit of measurement.
     *
     * Examples:
     * kg, ton, quintal
     */
    @NotBlank(message = "Unit is required")
    private String unit;

    /*
     * Price for one unit of the crop.
     */
    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.00", message = "Unit price cannot be negative")
    private BigDecimal unitPrice;


    // Default constructor required for JSON conversion.
    public InvoiceItemRequest() {
    }


    // Getters and setters

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
}