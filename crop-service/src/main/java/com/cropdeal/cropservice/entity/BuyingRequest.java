package com.cropdeal.cropservice.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "buying_requests", indexes = {
        @Index(name = "idx_br_crop_name", columnList = "cropName"),
        @Index(name = "idx_br_dealer_id", columnList = "dealerId"),
        @Index(name = "idx_br_district", columnList = "district"),
        @Index(name = "idx_br_status", columnList = "status")
})
public class BuyingRequest {

    public static final String ACTIVE = "ACTIVE";
    public static final String FULFILLED = "FULFILLED";
    public static final String CANCELLED = "CANCELLED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long dealerId;

    @Column(nullable = false, length = 100)
    private String cropName;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantity;

    @Column(nullable = false, length = 20)
    private String unit = "KG";

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal buyingPrice;

    @Column(nullable = false, length = 100)
    private String district;

    @Column(nullable = false, length = 100)
    private String state;

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false, length = 30)
    private String status = ACTIVE;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (status == null) status = ACTIVE;
        if (unit == null || unit.isBlank()) unit = "KG";
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDealerId() { return dealerId; }
    public void setDealerId(Long dealerId) { this.dealerId = dealerId; }

    public String getCropName() { return cropName; }
    public void setCropName(String cropName) { this.cropName = cropName; }

    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public BigDecimal getBuyingPrice() { return buyingPrice; }
    public void setBuyingPrice(BigDecimal buyingPrice) { this.buyingPrice = buyingPrice; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}