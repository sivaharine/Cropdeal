package com.cropdeal.cropservice.service;

import com.cropdeal.cropservice.command.CropCommandService;
import com.cropdeal.cropservice.dto.*;
import com.cropdeal.cropservice.query.CropQueryService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/**
 * Unified CropService acting as a facade for the CQRS Command and Query handlers.
 */
@Service
public class CropService {

    private final CropCommandService commandService;
    private final CropQueryService queryService;

    public CropService(CropCommandService commandService, CropQueryService queryService) {
        this.commandService = commandService;
        this.queryService = queryService;
    }

    // Commands
    public CropResponse create(CropCreateRequest request) {
        return commandService.create(request);
    }

    public CropResponse update(Long id, CropUpdateRequest request) {
        return commandService.update(id, request);
    }

    public void delete(Long id) {
        commandService.delete(id);
    }

    public CropResponse reduceQuantity(Long cropId, BigDecimal purchasedQuantity) {
        return commandService.reduceQuantity(cropId, purchasedQuantity);
    }

    // Queries
    public List<CropResponse> getAll() {
        return queryService.getAll();
    }

    public CropResponse getById(Long id) {
        return queryService.getById(id);
    }

    public List<CropResponse> getByFarmer(Long farmerId) {
        return queryService.getByFarmer(farmerId);
    }

    public List<CropSearchResponse> search(String commodity, String state, String district, String grade) {
        return queryService.search(commodity, state, district, grade);
    }
}
