package com.cropdeal.invoice.serviceimpl;

import com.cropdeal.invoice.entity.Invoice;
import com.cropdeal.invoice.entity.InvoiceItem;
import com.cropdeal.invoice.service.PdfInvoiceService;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

/**
 * Implementation of PDF invoice generation.
 */
@Service
public class PdfInvoiceServiceImpl implements PdfInvoiceService {

    /**
     * Converts an Invoice entity into a PDF document.
     *
     * @param invoice invoice information retrieved from the database
     * @return generated PDF content as byte array
     */
    @Override
    public byte[] generateInvoicePdf(Invoice invoice) {

        /*
         * ByteArrayOutputStream stores the generated PDF in memory.
         * The controller will later return these bytes to the client.
         */
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        /*
         * Document represents the PDF document that we are creating.
         */
        Document document = new Document();

        try {
            /*
             * Connect the PDF document with the output stream.
             */
            PdfWriter.getInstance(document, outputStream);

            /*
             * Open the document before adding content.
             */
            document.open();

            // Fonts used in the PDF.
            Font titleFont = FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    18
            );

            Font headingFont = FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    12
            );

            Font normalFont = FontFactory.getFont(
                    FontFactory.HELVETICA,
                    10
            );

            /*
             * Invoice title.
             */
            Paragraph title = new Paragraph("CROPDEAL INVOICE", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            document.add(new Paragraph(" "));

            /*
             * Basic invoice information.
             */
            document.add(new Paragraph(
                    "Invoice Number: " + invoice.getInvoiceNumber(),
                    normalFont
            ));

            document.add(new Paragraph(
                    "Invoice Date: " + invoice.getInvoiceDate()
                            .format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm")),
                    normalFont
            ));

            document.add(new Paragraph(
                    "Order ID: " + invoice.getOrderId(),
                    normalFont
            ));

            document.add(new Paragraph(
                    "Payment ID: " + invoice.getPaymentId(),
                    normalFont
            ));

            document.add(new Paragraph(
                    "Farmer ID: " + invoice.getFarmerId(),
                    normalFont
            ));

            document.add(new Paragraph(
                    "Dealer ID: " + invoice.getDealerId(),
                    normalFont
            ));

            document.add(new Paragraph(" "));

            /*
             * Items table.
             *
             * The table contains six columns:
             * 1. Item ID
             * 2. Crop Name
             * 3. Quantity
             * 4. Unit
             * 5. Unit Price
             * 6. Line Total
             */
            PdfPTable itemTable = new PdfPTable(6);

            itemTable.setWidthPercentage(100);

            addTableHeader(itemTable, "Item ID", headingFont);
            addTableHeader(itemTable, "Crop Name", headingFont);
            addTableHeader(itemTable, "Quantity", headingFont);
            addTableHeader(itemTable, "Unit", headingFont);
            addTableHeader(itemTable, "Unit Price", headingFont);
            addTableHeader(itemTable, "Line Total", headingFont);

            /*
             * Add each invoice item as one row in the table.
             */
            for (InvoiceItem item : invoice.getItems()) {

                itemTable.addCell(new Phrase(
                        String.valueOf(item.getId()),
                        normalFont
                ));

                itemTable.addCell(new Phrase(
                        item.getCropName(),
                        normalFont
                ));

                itemTable.addCell(new Phrase(
                        String.valueOf(item.getQuantity()),
                        normalFont
                ));

                itemTable.addCell(new Phrase(
                        item.getUnit(),
                        normalFont
                ));

                itemTable.addCell(new Phrase(
                        formatAmount(item.getUnitPrice()),
                        normalFont
                ));

                itemTable.addCell(new Phrase(
                        formatAmount(item.getLineTotal()),
                        normalFont
                ));
            }

            document.add(itemTable);

            document.add(new Paragraph(" "));

            /*
             * Summary section.
             */
            document.add(new Paragraph(
                    "Subtotal: " + formatAmount(invoice.getSubtotal()),
                    normalFont
            ));

            document.add(new Paragraph(
                    "Tax Amount: " + formatAmount(invoice.getTaxAmount()),
                    normalFont
            ));

            Paragraph totalParagraph = new Paragraph(
                    "Total Amount: " + formatAmount(invoice.getTotalAmount()),
                    headingFont
            );

            document.add(totalParagraph);

            document.add(new Paragraph(" "));

            document.add(new Paragraph(
                    "Invoice Status: " + invoice.getStatus(),
                    normalFont
            ));

            document.add(new Paragraph("Thank you for using CropDeal.", normalFont));

        } catch (DocumentException exception) {

            /*
             * Convert the PDF library exception into an unchecked exception.
             * This allows Spring to handle the failure without forcing
             * every caller to catch DocumentException.
             */
            throw new IllegalStateException(
                    "Unable to generate invoice PDF",
                    exception
            );

        } finally {

            /*
             * Always close the document to complete the PDF file correctly.
             */
            document.close();
        }

        return outputStream.toByteArray();
    }

    /**
     * Adds a formatted header cell to the invoice items table.
     */
    private void addTableHeader(
            PdfPTable table,
            String headerText,
            Font font
    ) {
        PdfPCell cell = new PdfPCell(new Phrase(headerText, font));

        cell.setHorizontalAlignment(Element.ALIGN_CENTER);

        table.addCell(cell);
    }

    /**
     * Formats monetary values with two decimal places.
     */
    private String formatAmount(BigDecimal amount) {

        if (amount == null) {
            return "0.00";
        }

        return amount.setScale(2).toPlainString();
    }
}