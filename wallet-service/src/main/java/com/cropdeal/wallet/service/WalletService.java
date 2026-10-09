package com.cropdeal.wallet.service;

import com.cropdeal.wallet.dto.*;
import java.math.BigDecimal;
import java.util.List;

public interface WalletService {
    WalletResponse getWallet(Long userId);
    WalletResponse creditWallet(CreditWalletRequest request);
    WalletResponse debitWallet(Long userId, BigDecimal amount, String description);
    WalletResponse reserveFunds(ReserveFundsRequest request);
    WalletResponse releaseFunds(ReleaseFundsRequest request);
    WalletResponse consumeFunds(ConsumeFundsRequest request);
    List<WalletTransactionResponse> getTransactions(Long userId);
}