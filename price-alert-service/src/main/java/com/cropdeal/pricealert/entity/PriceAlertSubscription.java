package com.cropdeal.pricealert.entity;

import com.cropdeal.pricealert.enums.PriceCondition;
import com.cropdeal.pricealert.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_alert_subscriptions", indexes = {
        @Index(name = "idx_sub_crop_role_active", columnList = "crop_name, user_role, active"),
        @Index(name = "idx_sub_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceAlertSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_role", nullable = false, length = 20)
    private UserRole userRole;

    @Column(name = "crop_name", nullable = false, length = 100)
    private String cropName;

    @Column(name = "target_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal targetPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "price_condition", nullable = false, length = 30)
    private PriceCondition priceCondition;

    @Column(length = 100)
    private String district;

    @Column(length = 100)
    private String state;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String unit = "kg";

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_notified_at")
    private LocalDateTime lastNotifiedAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.active == null) {
            this.active = true;
        }
        if (this.unit == null || this.unit.isBlank()) {
            this.unit = "kg";
        }
        if (this.cropName != null) {
            this.cropName = this.cropName.trim().toLowerCase();
        }
        if (this.district != null) {
            this.district = this.district.trim();
        }
        if (this.state != null) {
            this.state = this.state.trim();
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.cropName != null) {
            this.cropName = this.cropName.trim().toLowerCase();
        }
    }
}
