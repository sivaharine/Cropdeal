package com.cropdeal.priceservice.dto;

public class DistrictPriceResponse {

    private String commodity;

    private String state;

    private String district;

    private Double minPricePerKg;

    private Double maxPricePerKg;


    public DistrictPriceResponse() {
    }


    public String getCommodity() {
        return commodity;
    }

    public void setCommodity(String commodity) {
        this.commodity = commodity;
    }


    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }


    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }


    public Double getMinPricePerKg() {
        return minPricePerKg;
    }

    public void setMinPricePerKg(Double minPricePerKg) {
        this.minPricePerKg = minPricePerKg;
    }


    public Double getMaxPricePerKg() {
        return maxPricePerKg;
    }

    public void setMaxPricePerKg(Double maxPricePerKg) {
        this.maxPricePerKg = maxPricePerKg;
    }
}