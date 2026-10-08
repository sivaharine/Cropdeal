package com.cropdeal.user.service;

import com.cropdeal.user.dto.DealerResponse;
import com.cropdeal.user.dto.DealerUpdateRequest;
import com.cropdeal.user.entity.Dealer;
import com.cropdeal.user.exception.DealerNotFoundException;
import com.cropdeal.user.repository.DealerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DealerServiceImpl implements DealerService {

    private final DealerRepository dealerRepository;

    public DealerServiceImpl(DealerRepository dealerRepository) {
        this.dealerRepository = dealerRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public DealerResponse getDealerById(Long id) {
        Dealer dealer = dealerRepository.findById(id)
                .orElseThrow(() -> new DealerNotFoundException("Dealer not found with ID: " + id));
        return mapToResponse(dealer);
    }

    @Override
    @Transactional(readOnly = true)
    public DealerResponse getDealerByUserId(Long userId) {
        Dealer dealer = dealerRepository.findByUserId(userId)
                .orElseThrow(() -> new DealerNotFoundException("Dealer not found for user ID: " + userId));
        return mapToResponse(dealer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DealerResponse> getAllDealers() {
        return dealerRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public DealerResponse updateDealer(Long id, DealerUpdateRequest request) {
        Dealer dealer = dealerRepository.findById(id)
                .orElseThrow(() -> new DealerNotFoundException("Dealer not found with ID: " + id));

        applyUpdate(dealer, request);
        Dealer updatedDealer = dealerRepository.save(dealer);
        return mapToResponse(updatedDealer);
    }

    @Override
    public DealerResponse updateDealerByUserId(Long userId, DealerUpdateRequest request) {
        Dealer dealer = dealerRepository.findByUserId(userId)
                .orElseThrow(() -> new DealerNotFoundException("Dealer not found for user ID: " + userId));

        applyUpdate(dealer, request);
        Dealer updatedDealer = dealerRepository.save(dealer);
        return mapToResponse(updatedDealer);
    }

    @Override
    public DealerResponse createDealerProfile(Long userId, String name, String phone) {
        if (dealerRepository.existsByUserId(userId)) {
            return getDealerByUserId(userId);
        }

        Dealer dealer = new Dealer();
        dealer.setUserId(userId);
        dealer.setName(name);
        dealer.setPhone(phone);

        Dealer saved = dealerRepository.save(dealer);
        return mapToResponse(saved);
    }

    @Override
    public void deleteDealerByUserId(Long userId) {
        dealerRepository.findByUserId(userId).ifPresent(dealerRepository::delete);
    }

    private void applyUpdate(Dealer dealer, DealerUpdateRequest request) {
        if (request.getName() != null && !request.getName().isBlank()) {
            dealer.setName(request.getName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            dealer.setPhone(request.getPhone().trim());
        }
        if (request.getBusinessName() != null) {
            dealer.setBusinessName(request.getBusinessName().trim());
        }
        if (request.getAddress() != null) {
            dealer.setAddress(request.getAddress().trim());
        }
        if (request.getBankDetails() != null) {
            dealer.setBankDetails(request.getBankDetails().trim());
        }
    }

    private DealerResponse mapToResponse(Dealer dealer) {
        return new DealerResponse(
                dealer.getId(),
                dealer.getUserId(),
                dealer.getName(),
                dealer.getPhone(),
                dealer.getBusinessName(),
                dealer.getAddress(),
                dealer.getBankDetails()
        );
    }
}
