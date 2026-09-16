package com.cropdeal.priceservice.dto;

import java.time.LocalDate;

public class SyncResponse {

    private String message;
    private int processed;
    private int inserted;
    private int updated;
    private LocalDate latestDate;

    public SyncResponse() {
    }

    public SyncResponse(String message, int processed, int inserted, int updated, LocalDate latestDate) {
        this.message = message;
        this.processed = processed;
        this.inserted = inserted;
        this.updated = updated;
        this.latestDate = latestDate;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public int getProcessed() { return processed; }
    public void setProcessed(int processed) { this.processed = processed; }
    public int getInserted() { return inserted; }
    public void setInserted(int inserted) { this.inserted = inserted; }
    public int getUpdated() { return updated; }
    public void setUpdated(int updated) { this.updated = updated; }
    public LocalDate getLatestDate() { return latestDate; }
    public void setLatestDate(LocalDate latestDate) { this.latestDate = latestDate; }
}
