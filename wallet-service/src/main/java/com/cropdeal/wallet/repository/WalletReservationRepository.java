package com.cropdeal.wallet.repository;

import com.cropdeal.wallet.entity.ReservationStatus;
import com.cropdeal.wallet.entity.WalletReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WalletReservationRepository extends JpaRepository<WalletReservation, Long> {
    Optional<WalletReservation> findByUserIdAndReferenceIdAndStatus(Long userId, String referenceId, ReservationStatus status);
}