package com.cropdeal.wallet.service;

import com.cropdeal.wallet.dto.CreditWalletRequest;
import com.cropdeal.wallet.dto.ReserveFundsRequest;
import com.cropdeal.wallet.dto.WalletResponse;
import com.cropdeal.wallet.entity.Wallet;
import com.cropdeal.wallet.exception.InsufficientWalletBalanceException;
import com.cropdeal.wallet.repository.WalletRepository;
import com.cropdeal.wallet.repository.WalletReservationRepository;
import com.cropdeal.wallet.repository.WalletTransactionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private WalletTransactionRepository transactionRepository;

    @Mock
    private WalletReservationRepository reservationRepository;

    @InjectMocks
    private WalletServiceImpl walletService;

    @Test
    @DisplayName("Credit wallet adds funds to balance")
    void testCreditWallet() {
        Wallet wallet = new Wallet();
        wallet.setId(1L);
        wallet.setUserId(10L);
        wallet.setBalance(new BigDecimal("100.00"));
        wallet.setReservedBalance(BigDecimal.ZERO);

        when(walletRepository.findByUserId(10L)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(i -> i.getArgument(0));

        CreditWalletRequest req = new CreditWalletRequest(10L, new BigDecimal("50.00"), "Deposit");
        WalletResponse res = walletService.creditWallet(req);

        assertNotNull(res);
        assertEquals(new BigDecimal("150.00"), res.totalBalance());
        assertEquals(new BigDecimal("150.00"), res.availableBalance());
    }

    @Test
    @DisplayName("Debit wallet deducts funds when available balance is sufficient")
    void testDebitWalletSuccess() {
        Wallet wallet = new Wallet();
        wallet.setId(1L);
        wallet.setUserId(10L);
        wallet.setBalance(new BigDecimal("100.00"));
        wallet.setReservedBalance(BigDecimal.ZERO);

        when(walletRepository.findByUserId(10L)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(i -> i.getArgument(0));

        WalletResponse res = walletService.debitWallet(10L, new BigDecimal("40.00"), "Withdrawal");

        assertNotNull(res);
        assertEquals(new BigDecimal("60.00"), res.totalBalance());
    }

    @Test
    @DisplayName("Debit wallet throws InsufficientWalletBalanceException when funds are low")
    void testDebitWalletInsufficientThrows() {
        Wallet wallet = new Wallet();
        wallet.setId(1L);
        wallet.setUserId(10L);
        wallet.setBalance(new BigDecimal("20.00"));
        wallet.setReservedBalance(BigDecimal.ZERO);

        when(walletRepository.findByUserId(10L)).thenReturn(Optional.of(wallet));

        assertThrows(InsufficientWalletBalanceException.class,
                () -> walletService.debitWallet(10L, new BigDecimal("50.00"), "Overdraft"));
    }

    @Test
    @DisplayName("Reserve funds moves available balance to reserved balance")
    void testReserveFundsSuccess() {
        Wallet wallet = new Wallet();
        wallet.setId(1L);
        wallet.setUserId(10L);
        wallet.setBalance(new BigDecimal("100.00"));
        wallet.setReservedBalance(BigDecimal.ZERO);

        when(walletRepository.findByUserId(10L)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(i -> i.getArgument(0));

        ReserveFundsRequest req = new ReserveFundsRequest(10L, "BID-1-10", new BigDecimal("30.00"));
        WalletResponse res = walletService.reserveFunds(req);

        assertNotNull(res);
        assertEquals(new BigDecimal("100.00"), res.totalBalance());
        assertEquals(new BigDecimal("30.00"), res.reservedBalance());
        assertEquals(new BigDecimal("70.00"), res.availableBalance());
    }
}
