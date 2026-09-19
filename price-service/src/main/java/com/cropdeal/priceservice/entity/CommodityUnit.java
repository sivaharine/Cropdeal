package com.cropdeal.priceservice.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "commodity_units", uniqueConstraints = {
        @UniqueConstraint(name = "uk_commodity_variety", columnNames = {"commodity", "variety"})
})
public class CommodityUnit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String commodity;
    private String variety;
    private String sourceUnit;
    private Double kgPerUnit;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCommodity() { return commodity; }
    public void setCommodity(String commodity) { this.commodity = commodity; }
    public String getVariety() { return variety; }
    public void setVariety(String variety) { this.variety = variety; }
    public String getSourceUnit() { return sourceUnit; }
    public void setSourceUnit(String sourceUnit) { this.sourceUnit = sourceUnit; }
    public Double getKgPerUnit() { return kgPerUnit; }
    public void setKgPerUnit(Double kgPerUnit) { this.kgPerUnit = kgPerUnit; }
}
