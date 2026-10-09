package com.cropdeal.cropservice.query;

import com.cropdeal.cropservice.dto.CropResponse;
import com.cropdeal.cropservice.dto.CropSearchResponse;
import com.cropdeal.cropservice.entity.Crop;
import com.cropdeal.cropservice.exception.CropNotFoundException;
import com.cropdeal.cropservice.repository.CropRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * CQRS Query Service for Crop read operations (getAll, getById, getByFarmer, search).
 */
@Service
@Transactional(readOnly = true)
public class CropQueryService {

    private final CropRepository cropRepository;

    public CropQueryService(CropRepository cropRepository) {
        this.cropRepository = cropRepository;
    }

    public List<CropResponse> getAll() {
        return cropRepository.findAll().stream()
                .filter(c -> !Crop.DELETED.equalsIgnoreCase(c.getStatus()) && !Crop.CLOSED.equalsIgnoreCase(c.getStatus()))
                .map(this::toResponse).toList();
    }

    public CropResponse getById(Long id) {
        return toResponse(getEntity(id));
    }

    public List<CropResponse> getByFarmer(Long farmerId) {
        return cropRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId).stream()
                .filter(c -> !Crop.DELETED.equalsIgnoreCase(c.getStatus()))
                .map(this::toResponse).toList();
    }

    public List<CropSearchResponse> search(String commodity, String state, String district, String grade) {
        String normalizedGrade = blankToNull(grade);
        if (normalizedGrade != null) {
            normalizedGrade = normalizedGrade.toUpperCase();
            if (!normalizedGrade.matches("A|B|C")) {
                throw new IllegalArgumentException("Grade must be A, B or C");
            }
        }

        List<CropSearchResponse> result = cropRepository.searchAvailable(
                        blankToNull(commodity), blankToNull(state), blankToNull(district), normalizedGrade)
                .stream().map(this::toSearchResponse).toList();

        if (result.isEmpty()) {
            throw new CropNotFoundException("No available crops found for the given search criteria");
        }
        return result;
    }

    private Crop getEntity(Long id) {
        return cropRepository.findById(id)
                .orElseThrow(() -> new CropNotFoundException("Crop not found with id: " + id));
    }

    private String blankToNull(String val) {
        if (val == null || val.isBlank()) return null;
        return val.trim();
    }

    private CropResponse toResponse(Crop c) {
        String loc = (c.getDistrict() != null ? c.getDistrict() : "") +
                (c.getState() != null ? (c.getDistrict() != null ? ", " : "") + c.getState() : "");
        String fName = c.getFarmerName() != null ? c.getFarmerName() : ("Farmer #" + c.getFarmerId());
        String img = c.getImageUrl();
        return new CropResponse(
                c.getId(),
                c.getFarmerId(),
                fName,
                c.getCommodity(),
                c.getCommodity(),
                c.getState(),
                c.getDistrict(),
                loc,
                c.getGrade(),
                c.getQuantity(),
                c.getQuantity(),
                c.getUnit(),
                c.getPricePerKg(),
                c.getPricePerKg(),
                c.getDescription(),
                img,
                c.getStatus(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }

    private CropSearchResponse toSearchResponse(Crop c) {
        return new CropSearchResponse(c.getId(), c.getCommodity(), c.getState(), c.getDistrict(),
                c.getGrade(), c.getQuantity(), c.getUnit(), c.getPricePerKg(), c.getStatus());
    }
}
