package com.cropdeal.pricealert.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchCropListingRequest {

    @NotNull(message = "Listing ID is required")
    private Long listingId;

    private Long farmerId;
    private String farmerName;

    @NotBlank(message = "Crop name is required")
    private String cropName;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    private Double quantity;
    private String unit;
    private String district;
    private String state;
}
