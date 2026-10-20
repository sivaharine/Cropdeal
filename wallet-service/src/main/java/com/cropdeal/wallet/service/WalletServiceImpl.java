package com.cropdeal.wallet.service;

import com.cropdeal.wallet.dto.*;
import com.cropdeal.wallet.entity.*;
import com.cropdeal.wallet.exception.InsufficientWalletBalanceException;
import com.cropdeal.wallet.exception.ResourceNotFoundException;
import com.cropdeal.wallet.repository.WalletRepository;
import com.cropdeal.wallet.repository.WalletReservationRepository;
import com.cropdeal.wallet.repository.WalletTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class WalletServiceImpl implements WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final WalletReservationRepository reservationRepository;

    public WalletServiceImpl(WalletRepository walletRepository,
                             WalletTransactionRepository transactionRepository,
                             WalletReservationRepository reservationRepository) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.reservationRepository = reservationRepository;
    }

    @Override
    public WalletResponse getWallet(Long userId) {
        Wallet wallet = getOrCreateWallet(userId);
        return toResponse(wallet);
    }

    @Override
    public WalletResponse creditWallet(CreditWalletRequest request) {
        Wallet wallet = getOrCreateWallet(request.userId());
        wallet.setBalance(wallet.getBalance().add(request.amount()));
        Wallet saved = walletRepository.save(wallet);

        recordTransaction(wallet.getId(), request.userId(), request.amount(), TransactionType.CREDIT,
                "CREDIT-" + System.currentTimeMillis(), request.description() != null ? request.description() : "Wallet Top-up");

        return toResponse(saved);
    }

    @Override
    public WalletResponse debitWallet(Long userId, BigDecimal amount, String description) {
        Wallet wallet = getOrCreateWallet(userId);
        if (wallet.getAvailableBalance().compareTo(amount) < 0) {
            throw new InsufficientWalletBalanceException("Insufficient available funds for debit: available ₹" + wallet.getAvailableBalance());
        }
        wallet.setBalance(wallet.getBalance().subtract(amount));
        Wallet saved = walletRepository.save(wallet);

        recordTransaction(wallet.getId(), userId, amount, TransactionType.DEBIT,
                "DEBIT-" + System.currentTimeMillis(), description != null ? description : "Wallet Debit");

        return toResponse(saved);
    }

    @Override
    public WalletResponse reserveFunds(ReserveFundsRequest request) {
        Wallet wallet = getOrCreateWallet(request.userId());
        if (wallet.getAvailableBalance().compareTo(request.amount()) < 0) {
            throw new InsufficientWalletBalanceException("Insufficient available balance to place bid. Available: ₹"
                    + wallet.getAvailableBalance() + ", Required: ₹" + request.amount());
        }

        wallet.setReservedBalance(wallet.getReservedBalance().add(request.amount()));
        Wallet saved = walletRepository.save(wallet);

        WalletReservation reservation = new WalletReservation();
        reservation.setWalletId(wallet.getId());
        reservation.setUserId(request.userId());
        reservation.setReferenceId(request.referenceId());
        reservation.setAmount(request.amount());
        reservation.setStatus(ReservationStatus.ACTIVE);
        reservationRepository.save(reservation);

        recordTransaction(wallet.getId(), request.userId(), request.amount(), TransactionType.RESERVATION,
                request.referenceId(), "Reserved for bid " + request.referenceId());

        return toResponse(saved);
    }

    @Override
    public WalletResponse releaseFunds(ReleaseFundsRequest request) {
        Wallet wallet = getOrCreateWallet(request.userId());
        WalletReservation reservation = reservationRepository
                .findByUserIdAndReferenceIdAndStatus(request.userId(), request.referenceId(), ReservationStatus.ACTIVE)
                .orElse(null);

        if (reservation != null) {
            reservation.setStatus(ReservationStatus.RELEASED);
            reservationRepository.save(reservation);

            wallet.setReservedBalance(wallet.getReservedBalance().subtract(reservation.getAmount()));
            Wallet saved = walletRepository.save(wallet);

            recordTransaction(wallet.getId(), request.userId(), reservation.getAmount(), TransactionType.RELEASE,
                    request.referenceId(), "Released outbid funds for " + request.referenceId());
            return toResponse(saved);
        }
        return toResponse(wallet);
    }

    @Override
    public WalletResponse consumeFunds(ConsumeFundsRequest request) {
        Wallet wallet = getOrCreateWallet(request.userId());
        WalletReservation reservation = reservationRepository
                .findByUserIdAndReferenceIdAndStatus(request.userId(), request.referenceId(), ReservationStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Active reservation not found for " + request.referenceId()));

        reservation.setStatus(ReservationStatus.CONSUMED);
        reservationRepository.save(reservation);

        wallet.setReservedBalance(wallet.getReservedBalance().subtract(reservation.getAmount()));
        wallet.setBalance(wallet.getBalance().subtract(reservation.getAmount()));
        Wallet saved = walletRepository.save(wallet);

        recordTransaction(wallet.getId(), request.userId(), reservation.getAmount(), TransactionType.PAYMENT,
                request.referenceId(), "Payment consumed for won bid " + request.referenceId());

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WalletTransactionResponse> getTransactions(Long userId) {
        return transactionRepository.findByUserIdOrderByTransactionTimeDesc(userId).stream()
                .map(t -> new WalletTransactionResponse(
                        t.getId(), t.getUserId(), t.getAmount(), t.getType(),
                        t.getReferenceId(), t.getDescription(), t.getTransactionTime()
                ))
                .toList();
    }

    private Wallet getOrCreateWallet(Long userId) {
        return walletRepository.findByUserId(userId).orElseGet(() -> {
            Wallet newWallet = new Wallet();
            newWallet.setUserId(userId);
            newWallet.setUserRole("DEALER");
            newWallet.setBalance(BigDecimal.ZERO);
            newWallet.setReservedBalance(BigDecimal.ZERO);
            return walletRepository.save(newWallet);
        });
    }

    private void recordTransaction(Long walletId, Long userId, BigDecimal amount,
                                   TransactionType type, String refId, String desc) {
        WalletTransaction txn = new WalletTransaction();
        txn.setWalletId(walletId);
        txn.setUserId(userId);
        txn.setAmount(amount);
        txn.setType(type);
        txn.setReferenceId(refId);
        txn.setDescription(desc);
        transactionRepository.save(txn);
    }

    private WalletResponse toResponse(Wallet w) {
        return new WalletResponse(
                w.getId(),
                w.getUserId(),
                w.getUserRole(),
                w.getBalance(),
                w.getReservedBalance(),
                w.getAvailableBalance()
        );
    }
}