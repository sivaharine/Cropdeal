package com.cropdeal.cropservice.service;

import com.cropdeal.cropservice.config.RabbitMQConfig;
import com.cropdeal.cropservice.dto.BuyingRequestCreateDto;
import com.cropdeal.cropservice.dto.BuyingRequestCreatedEvent;
import com.cropdeal.cropservice.dto.BuyingRequestResponseDto;
import com.cropdeal.cropservice.entity.BuyingRequest;
import com.cropdeal.cropservice.repository.BuyingRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BuyingRequestService {

    private static final Logger log = LoggerFactory.getLogger(BuyingRequestService.class);

    private final BuyingRequestRepository repository;
    private final RabbitTemplate rabbitTemplate;

    public BuyingRequestService(BuyingRequestRepository repository, RabbitTemplate rabbitTemplate) {
        this.repository = repository;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Transactional
    public BuyingRequestResponseDto createBuyingRequest(BuyingRequestCreateDto dto, Long dealerId) {
        Long effectiveDealerId = (dealerId != null) ? dealerId : (dto.getDealerId() != null ? dto.getDealerId() : 1L);

        BuyingRequest request = new BuyingRequest();
        request.setDealerId(effectiveDealerId);
        request.setCropName(dto.getCropName().trim());
        request.setQuantity(dto.getQuantity());
        request.setUnit(dto.getUnit() != null && !dto.getUnit().isBlank() ? dto.getUnit().trim().toUpperCase() : "KG");
        request.setBuyingPrice(dto.getBuyingPrice());
        request.setDistrict(dto.getDistrict().trim());
        request.setState(dto.getState().trim());
        request.setNotes(dto.getNotes() != null ? dto.getNotes().trim() : null);
        request.setStatus(BuyingRequest.ACTIVE);

        BuyingRequest saved = repository.save(request);

        // Publish event to trigger Price Alert matching
        try {
            BuyingRequestCreatedEvent event = new BuyingRequestCreatedEvent(
                    saved.getId(),
                    saved.getDealerId(),
                    saved.getCropName(),
                    saved.getQuantity(),
                    saved.getBuyingPrice(),
                    saved.getUnit(),
                    saved.getDistrict(),
                    saved.getState()
            );
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.MARKETPLACE_EXCHANGE,
                    RabbitMQConfig.BUYING_REQUEST_ROUTING_KEY,
                    event
            );
            log.info("Published BuyingRequestCreatedEvent for dealer={}, crop={}, price={}",
                    saved.getDealerId(), saved.getCropName(), saved.getBuyingPrice());
        } catch (Exception e) {
            log.error("Failed to publish BuyingRequestCreatedEvent: {}", e.getMessage(), e);
        }

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BuyingRequestResponseDto> getActiveBuyingRequests() {
        return repository.findByStatusOrderByCreatedAtDesc(BuyingRequest.ACTIVE).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<BuyingRequestResponseDto> getByDealerId(Long dealerId) {
        return repository.findByDealerIdOrderByCreatedAtDesc(dealerId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public BuyingRequestResponseDto getById(Long id) {
        BuyingRequest b = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Buying request not found with id: " + id));
        return toResponse(b);
    }

    @Transactional
    public void cancelBuyingRequest(Long id, Long dealerId) {
        BuyingRequest b = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Buying request not found with id: " + id));
        b.setStatus(BuyingRequest.CANCELLED);
        repository.save(b);
    }

    private BuyingRequestResponseDto toResponse(BuyingRequest b) {
        BuyingRequestResponseDto dto = new BuyingRequestResponseDto();
        dto.setId(b.getId());
        dto.setDealerId(b.getDealerId());
        dto.setCropName(b.getCropName());
        dto.setQuantity(b.getQuantity());
        dto.setUnit(b.getUnit());
        dto.setBuyingPrice(b.getBuyingPrice());
        dto.setDistrict(b.getDistrict());
        dto.setState(b.getState());
        dto.setNotes(b.getNotes());
        dto.setStatus(b.getStatus());
        dto.setCreatedAt(b.getCreatedAt());
        dto.setUpdatedAt(b.getUpdatedAt());
        return dto;
    }
}