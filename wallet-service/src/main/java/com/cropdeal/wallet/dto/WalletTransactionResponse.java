package com.cropdeal.wallet.dto;

import com.cropdeal.wallet.entity.TransactionType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record WalletTransactionResponse(
    Long id,
    Long userId,
    BigDecimal amount,
    TransactionType type,
    String referenceId,
    String description,
    LocalDateTime transactionTime
) {}