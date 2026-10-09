package com.cropdeal.pricealert.entity;

import com.cropdeal.pricealert.enums.BuyingRequestStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "dealer_buying_requests", indexes = {
        @Index(name = "idx_buying_crop", columnList = "crop_name"),
        @Index(name = "idx_buying_dealer", columnList = "dealer_id"),
        @Index(name = "idx_buying_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealerBuyingRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dealer_id", nullable = false)
    private Long dealerId;

    @Column(name = "dealer_name")
    private String dealerName;

    @Column(name = "crop_name", nullable = false, length = 100)
    private String cropName;

    @Column(name = "offered_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal offeredPrice;

    @Column(name = "quantity_required", nullable = false)
    private Double quantityRequired;

    @Column(name = "unit", nullable = false, length = 20)
    private String unit;

    @Column(name = "district", length = 100)
    private String district;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "description", length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private BuyingRequestStatus status = BuyingRequestStatus.OPEN;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.cropName != null) {
            this.cropName = this.cropName.trim().toLowerCase();
        }
        if (this.status == null) {
            this.status = BuyingRequestStatus.OPEN;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.cropName != null) {
            this.cropName = this.cropName.trim().toLowerCase();
        }
    }
}
