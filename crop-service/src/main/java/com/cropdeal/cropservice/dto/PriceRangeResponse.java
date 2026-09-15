package com.cropdeal.cropservice.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PriceRangeResponse(String commodity, String state, String district, String grade,
                                 LocalDate priceDate, BigDecimal minPricePerKg, BigDecimal maxPricePerKg) {}
