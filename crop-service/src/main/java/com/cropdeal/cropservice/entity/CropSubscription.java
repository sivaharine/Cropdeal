package com.cropdeal.cropservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "crop_subscriptions")
public class CropSubscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "subscriber_id", nullable = false)
    private Long subscriberId;

    @Column(nullable = false, length = 100)
    private String commodity;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    private String district;

    @Column(length = 1)
    private String grade;

    @Column(nullable = false)
    private LocalDateTime subscribedAt;

    @PrePersist
    void onCreate() { subscribedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public Long getSubscriberId() { return subscriberId; }
    public void setSubscriberId(Long subscriberId) { this.subscriberId = subscriberId; }
    public String getCommodity() { return commodity; }
    public void setCommodity(String commodity) { this.commodity = commodity; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public LocalDateTime getSubscribedAt() { return subscribedAt; }
}
