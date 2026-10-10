package com.cropdeal.bidding.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateBiddingRequest(
    @NotNull Long farmerId,
    @NotBlank String cropName,
    @NotNull @DecimalMin("1.0") BigDecimal quantity,
    @NotBlank String unit,
    @NotNull @DecimalMin("1.00") BigDecimal basePrice,
    BigDecimal guidelinePrice,
    String location,
    String description,
    @JsonAlias({"imageUrl", "photo"}) String photoUrl
) {
    public CreateBiddingRequest(
        Long farmerId, String cropName, BigDecimal quantity, String unit,
        BigDecimal basePrice, BigDecimal guidelinePrice, String location, String description
    ) {
        this(farmerId, cropName, quantity, unit, basePrice, guidelinePrice, location, description, null);
    }
}