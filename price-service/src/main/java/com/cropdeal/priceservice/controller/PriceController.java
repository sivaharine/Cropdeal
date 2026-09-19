package com.cropdeal.priceservice.controller;

import com.cropdeal.priceservice.dto.CropPriceResponse;
import com.cropdeal.priceservice.dto.PriceSearchRequest;
import com.cropdeal.priceservice.service.PriceService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/prices")
public class PriceController {

    private final PriceService priceService;

    public PriceController(PriceService priceService) {
        this.priceService = priceService;
    }

    /**
     * Searches district first, then state, while keeping the requested grade
     * isolated. Only the latest available arrival date is used.
     */
    @PostMapping("/lookup")
    public CropPriceResponse lookupPrice(@Valid @RequestBody PriceSearchRequest request) {
        return priceService.getCropPrice(request);
    }

    /** Returns latest-day aggregated prices for all crops available in the database. */
    @GetMapping("/all")
    public List<CropPriceResponse> getAllLatestPrices() {
        return priceService.getAllLatestCropPrices();
    }
}
