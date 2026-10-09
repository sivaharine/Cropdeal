package com.cropdeal.cropservice.controller;

import com.cropdeal.cropservice.dto.CropCreateRequest;
import com.cropdeal.cropservice.dto.CropResponse;
import com.cropdeal.cropservice.dto.CropSearchResponse;
import com.cropdeal.cropservice.dto.CropUpdateRequest;
import com.cropdeal.cropservice.dto.QuantityUpdateRequest;
import com.cropdeal.cropservice.service.CropService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/crops", "/api/v1/crops"})
@Validated
public class CropController {
    private static final Path UPLOAD_DIR = Paths.get(System.getProperty("user.dir"), "uploads", "crops");
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

    @GetMapping
    public List<CropResponse> getAll() {
        return cropService.getAll();
    }

    @GetMapping("/{id}")
    public CropResponse getById(@PathVariable @Positive Long id) {
        return cropService.getById(id);
    }

    @GetMapping("/farmer/{farmerId}")
    public List<CropResponse> getByFarmer(@PathVariable String farmerId) {
        Long id = 1L;
        try {
            String digits = farmerId.replaceAll("\\D+", "");
            if (!digits.isEmpty()) {
                id = Long.parseLong(digits);
            }
        } catch (Exception ignored) {}
        return cropService.getByFarmer(id);
    }

    @GetMapping("/search")
    public List<CropSearchResponse> search(@RequestParam(required = false) String commodity,
                                           @RequestParam(required = false) String cropName,
                                           @RequestParam(required = false) String state,
                                           @RequestParam(required = false) String district,
                                           @RequestParam(required = false) String grade) {
        String query = commodity != null && !commodity.isBlank() ? commodity : cropName;
        return cropService.search(query, state, district, grade);
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

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadCropImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }
        try {
            if (!Files.exists(UPLOAD_DIR)) {
                Files.createDirectories(UPLOAD_DIR);
            }
            String original = file.getOriginalFilename();
            String ext = "";
            if (original != null && original.contains(".")) {
                ext = original.substring(original.lastIndexOf("."));
            } else {
                ext = ".jpg";
            }
            String filename = "crop_" + UUID.randomUUID().toString() + ext;
            Path destination = UPLOAD_DIR.resolve(filename);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            String imageUrl = "/api/crops/images/" + filename;
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl, "filename", filename));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to store image: " + e.getMessage()));
        }
    }

    @GetMapping("/images/{filename:.+}")
    public ResponseEntity<Resource> getCropImage(@PathVariable String filename) {
        try {
            Path file = UPLOAD_DIR.resolve(filename);
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(file);
                if (contentType == null) {
                    contentType = MediaType.IMAGE_JPEG_VALUE;
                }
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
