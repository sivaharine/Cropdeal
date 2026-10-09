package com.repository;

import com.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository
        extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrderId(Long orderId);

    java.util.List<Payment> findByDealerId(Long dealerId);

    java.util.List<Payment> findByFarmerId(Long farmerId);
}