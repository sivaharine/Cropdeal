package com.cropdeal.pricealert.service;

import com.cropdeal.pricealert.dto.BuyingRequestResponse;
import com.cropdeal.pricealert.dto.CreateBuyingRequest;
import com.cropdeal.pricealert.entity.DealerBuyingRequest;
import com.cropdeal.pricealert.enums.BuyingRequestStatus;
import com.cropdeal.pricealert.repository.DealerBuyingRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Slf4j
public class DealerBuyingRequestService {

    private final DealerBuyingRequestRepository buyingRequestRepository;
    private final PriceAlertMatchingEngine matchingEngine;

    @Transactional
    public BuyingRequestResponse createBuyingRequest(CreateBuyingRequest request) {
        log.info("Creating dealer buying request: dealerId={}, crop={}, offeredPrice={}, qty={}",
                request.getDealerId(), request.getCropName(), request.getOfferedPrice(), request.getQuantityRequired());

        DealerBuyingRequest entity = DealerBuyingRequest.builder()
                .dealerId(request.getDealerId())
                .dealerName(request.getDealerName())
                .cropName(request.getCropName().trim().toLowerCase())
                .offeredPrice(request.getOfferedPrice())
                .quantityRequired(request.getQuantityRequired())
                .unit(request.getUnit() != null ? request.getUnit().trim() : "kg")
                .district(request.getDistrict() != null ? request.getDistrict().trim() : null)
                .state(request.getState() != null ? request.getState().trim() : null)
                .description(request.getDescription())
                .status(BuyingRequestStatus.OPEN)
                .build();

        DealerBuyingRequest saved = buyingRequestRepository.save(entity);

        // Real-time matching against active Farmer subscriptions!
        try {
            int matched = matchingEngine.matchDealerBuyingRequest(saved);
            log.info("Dealer buying request #{} matched against {} farmer subscription(s)", saved.getId(), matched);
        } catch (Exception ex) {
            log.error("Error during real-time matching for dealer buying request #{}: {}", saved.getId(), ex.getMessage(), ex);
        }

        return BuyingRequestResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<BuyingRequestResponse> getRequestsByDealer(Long dealerId) {
        return buyingRequestRepository.findByDealerId(dealerId).stream()
                .map(BuyingRequestResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BuyingRequestResponse> getAllOpenRequests() {
        return buyingRequestRepository.findByStatus(BuyingRequestStatus.OPEN).stream()
                .map(BuyingRequestResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BuyingRequestResponse> getRequestsByCrop(String cropName) {
        return buyingRequestRepository.findByCropNameIgnoreCaseAndStatus(cropName.trim().toLowerCase(), BuyingRequestStatus.OPEN).stream()
                .map(BuyingRequestResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public BuyingRequestResponse getRequestById(Long id) {
        return buyingRequestRepository.findById(id)
                .map(BuyingRequestResponse::fromEntity)
                .orElseThrow(() -> new NoSuchElementException("Dealer buying request not found with id: " + id));
    }

    @Transactional
    public BuyingRequestResponse updateStatus(Long id, BuyingRequestStatus status) {
        DealerBuyingRequest entity = buyingRequestRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Dealer buying request not found with id: " + id));
        entity.setStatus(status);
        DealerBuyingRequest saved = buyingRequestRepository.save(entity);
        return BuyingRequestResponse.fromEntity(saved);
    }
}
