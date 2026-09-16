package com.cropdeal.invoice.mapper;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.cropdeal.invoice.dto.request.InvoiceItemRequest;
import com.cropdeal.invoice.dto.response.InvoiceItemResponse;
import com.cropdeal.invoice.dto.response.InvoiceResponse;
import com.cropdeal.invoice.entity.Invoice;
import com.cropdeal.invoice.entity.InvoiceItem;

/*
 * @Component tells Spring to create an object of this class
 * and manage it as a Spring bean.
 *
 * The mapper is responsible only for converting objects.
 * It should not contain database or business logic.
 */
@Component
public class InvoiceMapper {

    /*
     * Converts an InvoiceItemRequest into an InvoiceItem entity.
     *
     * The lineTotal is not calculated here.
     * It will be calculated in the service layer because
     * calculation is business logic.
     */
    public InvoiceItem toEntity(InvoiceItemRequest request) {

        InvoiceItem item = new InvoiceItem();

        item.setCropName(request.getCropName());
        item.setQuantity(request.getQuantity());
        item.setUnit(request.getUnit());
        item.setUnitPrice(request.getUnitPrice());

        return item;
    }


    /*
     * Converts an Invoice entity into an InvoiceResponse DTO.
     */
    public InvoiceResponse toResponse(Invoice invoice) {

        InvoiceResponse response = new InvoiceResponse();

        response.setId(invoice.getId());
        response.setInvoiceNumber(invoice.getInvoiceNumber());
        response.setOrderId(invoice.getOrderId());
        response.setPaymentId(invoice.getPaymentId());
        response.setFarmerId(invoice.getFarmerId());
        response.setDealerId(invoice.getDealerId());
        response.setInvoiceDate(invoice.getInvoiceDate());
        response.setSubtotal(invoice.getSubtotal());
        response.setTaxAmount(invoice.getTaxAmount());
        response.setTotalAmount(invoice.getTotalAmount());
        response.setStatus(invoice.getStatus());
        response.setPdfPath(invoice.getPdfPath());
        response.setCreatedAt(invoice.getCreatedAt());

        /*
         * Convert each InvoiceItem entity into an
         * InvoiceItemResponse DTO.
         */
        List<InvoiceItemResponse> itemResponses = new ArrayList<>();

        for (InvoiceItem item : invoice.getItems()) {

            InvoiceItemResponse itemResponse = new InvoiceItemResponse();

            itemResponse.setId(item.getId());
            itemResponse.setCropName(item.getCropName());
            itemResponse.setQuantity(item.getQuantity());
            itemResponse.setUnit(item.getUnit());
            itemResponse.setUnitPrice(item.getUnitPrice());
            itemResponse.setLineTotal(item.getLineTotal());

            itemResponses.add(itemResponse);
        }

        response.setItems(itemResponses);

        return response;
    }
}