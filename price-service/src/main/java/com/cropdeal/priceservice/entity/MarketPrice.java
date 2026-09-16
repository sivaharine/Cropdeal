package com.cropdeal.priceservice.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "market_prices", indexes = {
        })
public class MarketPrice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String state;
    private String district;
    private String market;
    private String commodity;
    private String variety;
    private String grade;
    private LocalDate arrivalDate;

    private Double minPrice;
    private Double maxPrice;
    private Double modalPrice;

    // data.gov.in does not expose a unit field for this resource.
    // sourceUnit/kgPerUnit are resolved by our unit rules.
    private String sourceUnit;
    private Double kgPerUnit;
    private Double minPricePerKg;
    private Double maxPricePerKg;
    private Double modalPricePerKg;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getMarket() { return market; }
    public void setMarket(String market) { this.market = market; }
    public String getCommodity() { return commodity; }
    public void setCommodity(String commodity) { this.commodity = commodity; }
    public String getVariety() { return variety; }
    public void setVariety(String variety) { this.variety = variety; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public LocalDate getArrivalDate() { return arrivalDate; }
    public void setArrivalDate(LocalDate arrivalDate) { this.arrivalDate = arrivalDate; }
    public Double getMinPrice() { return minPrice; }
    public void setMinPrice(Double minPrice) { this.minPrice = minPrice; }
    public Double getMaxPrice() { return maxPrice; }
    public void setMaxPrice(Double maxPrice) { this.maxPrice = maxPrice; }
    public Double getModalPrice() { return modalPrice; }
    public void setModalPrice(Double modalPrice) { this.modalPrice = modalPrice; }
    public String getSourceUnit() { return sourceUnit; }
    public void setSourceUnit(String sourceUnit) { this.sourceUnit = sourceUnit; }
    public Double getKgPerUnit() { return kgPerUnit; }
    public void setKgPerUnit(Double kgPerUnit) { this.kgPerUnit = kgPerUnit; }
    public Double getMinPricePerKg() { return minPricePerKg; }
    public void setMinPricePerKg(Double minPricePerKg) { this.minPricePerKg = minPricePerKg; }
    public Double getMaxPricePerKg() { return maxPricePerKg; }
    public void setMaxPricePerKg(Double maxPricePerKg) { this.maxPricePerKg = maxPricePerKg; }
    public Double getModalPricePerKg() { return modalPricePerKg; }
    public void setModalPricePerKg(Double modalPricePerKg) { this.modalPricePerKg = modalPricePerKg; }
}
