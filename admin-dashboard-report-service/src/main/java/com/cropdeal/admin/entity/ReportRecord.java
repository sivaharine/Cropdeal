package com.cropdeal.admin.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_report_records")
public class ReportRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_type", nullable = false)
    private String reportType;

    @Column(name = "format", nullable = false)
    private String format; // JSON or CSV

    @Column(name = "generated_by", nullable = false)
    private String generatedBy;

    @Column(name = "record_count")
    private int recordCount;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    public ReportRecord() {}

    public ReportRecord(String reportType, String format, String generatedBy, int recordCount) {
        this.reportType = reportType;
        this.format = format;
        this.generatedBy = generatedBy;
        this.recordCount = recordCount;
        this.generatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getReportType() { return reportType; }
    public void setReportType(String reportType) { this.reportType = reportType; }
    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }
    public String getGeneratedBy() { return generatedBy; }
    public void setGeneratedBy(String generatedBy) { this.generatedBy = generatedBy; }
    public int getRecordCount() { return recordCount; }
    public void setRecordCount(int recordCount) { this.recordCount = recordCount; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
}
