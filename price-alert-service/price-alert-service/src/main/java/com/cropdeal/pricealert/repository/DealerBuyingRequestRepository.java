package com.cropdeal.pricealert.repository;

import com.cropdeal.pricealert.entity.DealerBuyingRequest;
import com.cropdeal.pricealert.enums.BuyingRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DealerBuyingRequestRepository extends JpaRepository<DealerBuyingRequest, Long> {

    List<DealerBuyingRequest> findByDealerId(Long dealerId);

    List<DealerBuyingRequest> findByCropNameIgnoreCaseAndStatus(String cropName, BuyingRequestStatus status);

    List<DealerBuyingRequest> findByStatus(BuyingRequestStatus status);
}
