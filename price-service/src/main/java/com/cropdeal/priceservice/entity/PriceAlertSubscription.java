package com.cropdeal.priceservice.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_alert_subscriptions", indexes = {
        @Index(name = "idx_pas_crop_name", columnList = "crop_name"),
        @Index(name = "idx_pas_user_id", columnList = "user_id"),
        @Index(name = "idx_pas_user_role", columnList = "user_role"),
        @Index(name = "idx_pas_district", columnList = "district"),
        @Index(name = "idx_pas_state", columnList = "state"),
        @Index(name = "idx_pas_active", columnList = "active"),
        @Index(name = "idx_pas_matching", columnList = "crop_name, district, state, active")
})
public class PriceAlertSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 30)
    private String userRole; // FARMER, DEALER

    @Column(nullable = false, length = 100)
    private String cropName;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal targetPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PriceCondition priceCondition;

    @Column(length = 100)
    private String district;

    @Column(length = 100)
    private String state;

    @Column(nullable = false, length = 20)
    private String unit = "KG";

    @Column(nullable = false)
    private Boolean active = true;

    private LocalDateTime lastNotifiedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (active == null) active = true;
        if (unit == null || unit.isBlank()) unit = "KG";
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }

    public String getCropName() { return cropName; }
    public void setCropName(String cropName) { this.cropName = cropName; }

    public BigDecimal getTargetPrice() { return targetPrice; }
    public void setTargetPrice(BigDecimal targetPrice) { this.targetPrice = targetPrice; }

    public PriceCondition getPriceCondition() { return priceCondition; }
    public void setPriceCondition(PriceCondition priceCondition) { this.priceCondition = priceCondition; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public LocalDateTime getLastNotifiedAt() { return lastNotifiedAt; }
    public void setLastNotifiedAt(LocalDateTime lastNotifiedAt) { this.lastNotifiedAt = lastNotifiedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
