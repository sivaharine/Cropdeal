package com.cropdeal.pricealert.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DatabasePriceDto {
    private String commodity;
    private String state;
    private String district;
    private String grade;
    private LocalDate priceDate;
    private Double minPricePerKg;
    private Double maxPricePerKg;
    private Double modalPricePerKg;
}
