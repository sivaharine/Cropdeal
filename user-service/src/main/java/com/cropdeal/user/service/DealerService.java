package com.cropdeal.user.service;

import com.cropdeal.user.dto.DealerResponse;
import com.cropdeal.user.dto.DealerUpdateRequest;
import com.cropdeal.user.enums.Role;

import java.util.List;

public interface DealerService {

    DealerResponse getDealerById(Long id);

    DealerResponse getDealerByUserId(Long userId);

    List<DealerResponse> getAllDealers();

    DealerResponse updateDealer(Long id, DealerUpdateRequest request);

    DealerResponse updateDealerByUserId(Long userId, DealerUpdateRequest request);

    DealerResponse createDealerProfile(Long userId, String name, String email, String phone, Role role);

    default DealerResponse createDealerProfile(Long userId, String name, String phone) {
        return createDealerProfile(userId, name, null, phone, Role.DEALER);
    }

    void deleteDealerByUserId(Long userId);
}
