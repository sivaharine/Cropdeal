package com.cropdeal.invoice.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cropdeal.invoice.entity.Invoice;

/*
 * JpaRepository provides ready-made database operations such as:
 *
 * save()
 * findById()
 * findAll()
 * deleteById()
 * existsById()
 *
 * Invoice is the entity managed by this repository.
 * Long is the data type of the Invoice primary key.
 */
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    /*
     * Finds an invoice using its unique invoice number.
     *
     * Spring Data JPA automatically generates the query
     * from the method name.
     */
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    /*
     * Finds an invoice using the related order ID.
     */
    Optional<Invoice> findByOrderId(Long orderId);
}