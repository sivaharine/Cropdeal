package com.cropdeal.cropservice.repository;

import com.cropdeal.cropservice.entity.BuyingRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BuyingRequestRepository extends JpaRepository<BuyingRequest, Long> {
    List<BuyingRequest> findByDealerIdOrderByCreatedAtDesc(Long dealerId);
    List<BuyingRequest> findByStatusOrderByCreatedAtDesc(String status);
}