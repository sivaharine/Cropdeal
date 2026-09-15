package com.cropdeal.priceservice.controller;

import com.cropdeal.priceservice.dto.DistrictPriceResponse;
import com.cropdeal.priceservice.service.PriceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/prices")
public class PriceController {

    private final PriceService priceService;

    public PriceController(PriceService priceService) {
        this.priceService = priceService;
    }

    /*
     * GET /api/prices?commodity=Tomato&state=Tamil Nadu&district=Coimbatore
     *
     * All query parameters are optional but at least commodity is
     * recommended for meaningful results.
     *
     * Response fields: commodity, state, district, minPricePerKg, maxPricePerKg
     *
     * If a district has multiple markets, prices are averaged.
     */
    @GetMapping
    public ResponseEntity<List<DistrictPriceResponse>> getCropPrices(
            @RequestParam(required = false) String commodity,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district) {

        List<DistrictPriceResponse> prices =
                priceService.getCropPrices(commodity, state, district);

        return ResponseEntity.ok(prices);
    }
}