package com.cropdeal.priceservice.controller;

import com.cropdeal.priceservice.dto.CropPriceResponse;
import com.cropdeal.priceservice.dto.PriceSearchRequest;
import com.cropdeal.priceservice.service.PriceService;
import com.cropdeal.priceservice.dto.SyncResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/prices", "/api/v1/prices"})
@Tag(name = "Market & Government Pricing", description = "Endpoints for market prices, commodity lookup, and government data")
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
    @Operation(summary = "Lookup market crop price from database", description = "Queries database for latest arrival date price by commodity, state, district, grade")
    public CropPriceResponse lookupPrice(@Valid @RequestBody PriceSearchRequest request) {
        return priceService.getCropPrice(request);
    }

    /** Lookup latest database benchmark price directly by commodity name */
    @GetMapping("/commodity/{commodity}")
    @Operation(summary = "Lookup latest price by commodity name from database", description = "Finds latest stored database price for the given commodity")
    public ResponseEntity<CropPriceResponse> getPriceByCommodity(@PathVariable String commodity) {
        return priceService.getLatestPriceByCommodity(commodity)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Validate crop price against database benchmark (used by chatbot and services) */
    @GetMapping("/validate")
    @Operation(summary = "Validate crop price against database benchmark")
    public ResponseEntity<CropPriceResponse> validateCropPrice(
            @RequestParam(required = false) String cropName,
            @RequestParam(required = false) String commodity) {
        String query = cropName != null ? cropName : commodity;
        return priceService.getLatestPriceByCommodity(query)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Returns latest-day aggregated prices for all crops available in the database. */
    @GetMapping("/all")
    @Operation(summary = "Get all latest crop prices from database", description = "Returns stored government and market prices for all crops in our database")
    public List<CropPriceResponse> getAllLatestPrices() {
        return priceService.getAllLatestCropPrices();
    }

    /** Manual trigger to sync government prices on-demand */
    @PostMapping("/sync")
    @Operation(summary = "Manually synchronize government prices", description = "On-demand synchronization from data.gov.in. Disabled on startup to prevent repeated external calls.")
    public ResponseEntity<SyncResponse> syncGovernmentPrices() {
        return ResponseEntity.ok(priceService.syncLatestGovernmentPrices());
    }
}
