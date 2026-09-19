package com.repository;

import com.entity.Refund;
import com.entity.RefundStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RefundRepository
        extends JpaRepository<Refund, Long> {

    Optional<Refund> findByPaymentIdAndStatus(
            Long paymentId,
            RefundStatus status);

    List<Refund> findByPaymentId(Long paymentId);
}