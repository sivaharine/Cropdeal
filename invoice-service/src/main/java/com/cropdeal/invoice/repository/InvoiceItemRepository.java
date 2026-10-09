package com.cropdeal.invoice.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cropdeal.invoice.entity.InvoiceItem;

/*
 * Repository used for database operations on InvoiceItem.
 *
 * Most item operations can also be performed through the
 * Invoice entity because Invoice uses CascadeType.ALL.
 */
public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, Long> {
}