package com.repository;

import com.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
    Optional<WalletTransaction> findByReferenceIdAndTransactionType(String referenceId, String transactionType);
    Optional<WalletTransaction> findFirstByReferenceIdAndTransactionTypeOrderByIdAsc(String referenceId, String transactionType);
    List<WalletTransaction> findByUserId(Long userId);
    List<WalletTransaction> findByWalletId(Long walletId);
}
