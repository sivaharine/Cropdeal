package com.cropdeal.cropservice.controller;

import com.cropdeal.cropservice.dto.CropCreateRequest;
import com.cropdeal.cropservice.dto.CropResponse;
import com.cropdeal.cropservice.dto.CropSearchResponse;
import com.cropdeal.cropservice.dto.CropUpdateRequest;
import com.cropdeal.cropservice.dto.QuantityUpdateRequest;
import com.cropdeal.cropservice.service.CropService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/crops")
@Validated
public class CropController {
    private final CropService cropService;

    public CropController(CropService cropService) {
        this.cropService = cropService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CropResponse create(@Valid @RequestBody CropCreateRequest request) {
        return cropService.create(request);
    }

    @PutMapping("/{id}")
    public CropResponse update(@PathVariable @Positive Long id,
                               @Valid @RequestBody CropUpdateRequest request) {
        return cropService.update(id, request);
    }

    @GetMapping("/{id}")
    public CropResponse getById(@PathVariable @Positive Long id) {
        return cropService.getById(id);
    }

    @GetMapping("/farmer/{farmerId}")
    public List<CropResponse> getByFarmer(@PathVariable @Positive Long farmerId) {
        return cropService.getByFarmer(farmerId);
    }

    @GetMapping("/search")
    public List<CropSearchResponse> search(@RequestParam(required = false) String commodity,
                                           @RequestParam(required = false) String state,
                                           @RequestParam(required = false) String district,
                                           @RequestParam(required = false) String grade) {
        return cropService.search(commodity, state, district, grade);
    }

    /**
     * Internal purchase callback for Order/Deal Service.
     * Reduces available quantity atomically. When it reaches zero the crop becomes SOLD_OUT.
     */
    @PatchMapping("/{id}/quantity")
    public CropResponse reduceQuantity(@PathVariable @Positive Long id,
                                       @Valid @RequestBody QuantityUpdateRequest request) {
        return cropService.reduceQuantity(id, request.getPurchasedQuantity());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable @Positive Long id) {
        cropService.delete(id);
    }
}
