package com.cropdeal.user.service;

import com.cropdeal.user.dto.DealerResponse;
import com.cropdeal.user.dto.DealerUpdateRequest;

import java.util.List;

public interface DealerService {

    DealerResponse getDealerById(Long id);

    DealerResponse getDealerByUserId(Long userId);

    List<DealerResponse> getAllDealers();

    DealerResponse updateDealer(Long id, DealerUpdateRequest request);

    DealerResponse updateDealerByUserId(Long userId, DealerUpdateRequest request);

    DealerResponse createDealerProfile(Long userId, String name, String phone);

    void deleteDealerByUserId(Long userId);
}
