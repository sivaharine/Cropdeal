package com.cropdeal.wallet.dto;

import java.math.BigDecimal;

public record WalletResponse(
    Long walletId,
    Long userId,
    String userRole,
    BigDecimal totalBalance,
    BigDecimal reservedBalance,
    BigDecimal availableBalance
) {}