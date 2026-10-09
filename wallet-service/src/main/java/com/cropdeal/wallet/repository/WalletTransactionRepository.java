package com.cropdeal.wallet.repository;

import com.cropdeal.wallet.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
    List<WalletTransaction> findByUserIdOrderByTransactionTimeDesc(Long userId);
}