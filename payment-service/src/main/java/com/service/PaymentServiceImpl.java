package com.service;

import com.config.NotificationRabbitConfig;
import com.dto.*;
import com.entity.Payment;
import com.entity.PaymentStatus;
import com.entity.Wallet;
import com.entity.WalletTransaction;
import com.exception.PaymentNotFoundException;
import com.repository.PaymentRepository;
import com.repository.WalletRepository;
import com.repository.WalletTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

    private final PaymentRepository paymentRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final PaymentInvoiceClient paymentInvoiceClient;
    private final RabbitTemplate rabbitTemplate;

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            WalletRepository walletRepository,
            WalletTransactionRepository walletTransactionRepository,
            PaymentInvoiceClient paymentInvoiceClient,
            RabbitTemplate rabbitTemplate) {
        this.paymentRepository = paymentRepository;
        this.walletRepository = walletRepository;
        this.walletTransactionRepository = walletTransactionRepository;
        this.paymentInvoiceClient = paymentInvoiceClient;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Override
    @Transactional
    public PaymentResponse makePayment(PaymentRequest request) {

        if ("CASH_ON_DELIVERY".equalsIgnoreCase(request.getPaymentMethod())) {
            throw new IllegalArgumentException(
                    "Cash on delivery payments are processed upon delivery, not online payment");
        }

        Optional<Payment> existingPayment =
                paymentRepository.findByOrderId(request.getOrderId());

        if (existingPayment.isPresent()) {
            Payment payment = existingPayment.get();
            if (payment.getStatus() == PaymentStatus.SUCCESS) {
                return mapToResponse(payment);
            }
        }

        Payment payment = new Payment();
        payment.setOrderId(request.getOrderId());
        payment.setDealerId(request.getDealerId());
        payment.setFarmerId(request.getFarmerId());
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setTransactionReference(
                "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        Payment savedPayment = paymentRepository.save(payment);

        savedPayment.setStatus(PaymentStatus.SUCCESS);
        savedPayment.setPaidAt(LocalDateTime.now());
        Payment finalPayment = paymentRepository.save(savedPayment);

        try {
            InvoicePaymentRequest invoiceRequest = new InvoicePaymentRequest();
            invoiceRequest.setOrderId(finalPayment.getOrderId());
            invoiceRequest.setDealerId(finalPayment.getDealerId());
            invoiceRequest.setFarmerId(finalPayment.getFarmerId());
            invoiceRequest.setAmount(finalPayment.getAmount());
            invoiceRequest.setPaymentMethod(finalPayment.getPaymentMethod());
            invoiceRequest.setTransactionReference(
                    finalPayment.getTransactionReference());

            paymentInvoiceClient.generateInvoiceFromPayment(invoiceRequest);
        } catch (Exception ignored) {
        }

        publishPaymentCompleted(finalPayment);

        return mapToResponse(finalPayment);
    }

    @Override
    public PaymentResponse getPaymentById(Long id) {

        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() ->
                        new PaymentNotFoundException(
                                "Payment not found with id: " + id));

        return mapToResponse(payment);
    }

    @Override
    public PaymentResponse getPaymentByOrderId(Long orderId) {

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() ->
                        new PaymentNotFoundException(
                                "Payment not found for order id: " + orderId));

        return mapToResponse(payment);
    }

    @Override
    @Transactional
    public PaymentResponse refundPaymentByOrderId(Long orderId) {

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() ->
                        new PaymentNotFoundException(
                                "Payment not found for order id: " + orderId));

        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            return mapToResponse(payment);
        }

        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new IllegalStateException(
                    "Only successful payments can be refunded");
        }

        payment.setStatus(PaymentStatus.REFUNDED);
        Payment refundedPayment = paymentRepository.save(payment);

        return mapToResponse(refundedPayment);
    }

    @Override
    public List<PaymentResponse> getAllPayments() {

        return paymentRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PaymentResponse updatePayment(Long id, PaymentRequest request) {

        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() ->
                        new PaymentNotFoundException(
                                "Payment not found with id: " + id));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new IllegalStateException(
                    "Successful payments cannot be modified");
        }

        payment.setOrderId(request.getOrderId());
        payment.setDealerId(request.getDealerId());
        payment.setFarmerId(request.getFarmerId());
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());

        Payment updatedPayment = paymentRepository.save(payment);

        return mapToResponse(updatedPayment);
    }

    @Override
    @Transactional
    public void deletePayment(Long id) {

        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() ->
                        new PaymentNotFoundException(
                                "Payment not found with id: " + id));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new IllegalStateException(
                    "Successful payments cannot be deleted");
        }

        paymentRepository.delete(payment);
    }

    @Override
    @Transactional
    public WalletResponse creditWallet(WalletSettlementRequest request) {

        Optional<WalletTransaction> existingTx =
                findExistingWalletTransaction(request.getReferenceId(), "SETTLEMENT");

        if (existingTx.isPresent()) {
            return getWallet(request.getUserId());
        }

        Wallet wallet = getOrCreateWallet(request.getUserId(), request.getUserRole(), "ROLE_DELIVERY_PARTNER");
        wallet.setBalance(wallet.getBalance().add(request.getAmount()));
        Wallet savedWallet = walletRepository.save(wallet);

        WalletTransaction tx = new WalletTransaction();
        tx.setWalletId(savedWallet.getId());
        tx.setUserId(request.getUserId());
        tx.setAmount(request.getAmount());
        tx.setTransactionType("SETTLEMENT");
        tx.setReferenceId(request.getReferenceId());
        tx.setStatus("SUCCESS");
        tx.setDescription(request.getDescription() != null ? request.getDescription() : "Delivery settlement for " + request.getReferenceId());
        walletTransactionRepository.save(tx);

        return mapToWalletResponse(savedWallet);
    }

    @Override
    @Transactional
    public WalletResponse creditWallet(WalletCreditRequest request) {
        String txType = request.getTransactionType() != null ? request.getTransactionType() : "CREDIT";

        Optional<WalletTransaction> existingTx =
                findExistingWalletTransaction(request.getReferenceId(), txType);

        if (existingTx.isPresent()) {
            return getWallet(request.getUserId());
        }

        Wallet wallet = getOrCreateWallet(request.getUserId(), request.getUserRole(), "ROLE_USER");
        wallet.setBalance(wallet.getBalance().add(request.getAmount()));
        Wallet savedWallet = walletRepository.save(wallet);

        WalletTransaction tx = new WalletTransaction();
        tx.setWalletId(savedWallet.getId());
        tx.setUserId(request.getUserId());
        tx.setAmount(request.getAmount());
        tx.setTransactionType(txType);
        tx.setReferenceId(request.getReferenceId());
        tx.setStatus("SUCCESS");
        tx.setDescription(request.getDescription() != null ? request.getDescription() : txType + " for " + request.getReferenceId());
        walletTransactionRepository.save(tx);

        return mapToWalletResponse(savedWallet);
    }

    @Override
    @Transactional
    public WalletResponse debitWallet(WalletDebitRequest request) {
        Wallet wallet = getOrCreateWallet(request.getUserId(), request.getUserRole(), "ROLE_USER");

        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new IllegalStateException(
                    String.format("Insufficient wallet balance: current balance is â‚¹%s, requested debit is â‚¹%s",
                            wallet.getBalance().toPlainString(), request.getAmount().toPlainString()));
        }

        wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
        Wallet savedWallet = walletRepository.save(wallet);

        String txType = request.getTransactionType() != null ? request.getTransactionType() : "DEBIT";
        WalletTransaction tx = new WalletTransaction();
        tx.setWalletId(savedWallet.getId());
        tx.setUserId(request.getUserId());
        tx.setAmount(request.getAmount().negate());
        tx.setTransactionType(txType);
        tx.setReferenceId(request.getReferenceId());
        tx.setStatus("SUCCESS");
        tx.setDescription(request.getDescription() != null ? request.getDescription() : txType + " for " + request.getReferenceId());
        walletTransactionRepository.save(tx);

        return mapToWalletResponse(savedWallet);
    }

    @Override
    @Transactional
    public WalletResponse topUpWallet(WalletTopUpRequest request) {
        Wallet wallet = getOrCreateWallet(request.getUserId(), request.getUserRole(), "ROLE_USER");
        wallet.setBalance(wallet.getBalance().add(request.getAmount()));
        Wallet savedWallet = walletRepository.save(wallet);

        String ref = request.getTransactionReference() != null && !request.getTransactionReference().isBlank()
                ? request.getTransactionReference()
                : "TOPUP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        WalletTransaction tx = new WalletTransaction();
        tx.setWalletId(savedWallet.getId());
        tx.setUserId(request.getUserId());
        tx.setAmount(request.getAmount());
        tx.setTransactionType("WALLET_TOPUP");
        tx.setReferenceId(ref);
        tx.setStatus("SUCCESS");
        tx.setDescription("Wallet top-up via " + (request.getPaymentMethod() != null ? request.getPaymentMethod() : "UPI"));
        walletTransactionRepository.save(tx);

        return mapToWalletResponse(savedWallet);
    }

    @Override
    public WalletResponse getWallet(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Wallet emptyWallet = new Wallet();
                    emptyWallet.setUserId(userId);
                    emptyWallet.setUserRole("ROLE_USER");
                    emptyWallet.setBalance(BigDecimal.ZERO);
                    emptyWallet.setCurrency("INR");
                    return emptyWallet;
                });

        return mapToWalletResponse(wallet);
    }

    private Wallet getOrCreateWallet(Long userId, String userRole, String defaultRole) {
        return walletRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Wallet newWallet = new Wallet();
                    newWallet.setUserId(userId);
                    newWallet.setUserRole(userRole != null ? userRole : defaultRole);
                    newWallet.setBalance(BigDecimal.ZERO);
                    newWallet.setCurrency("INR");
                    return walletRepository.save(newWallet);
                });
    }

    private Optional<WalletTransaction> findExistingWalletTransaction(String referenceId, String transactionType) {
        try {
            return walletTransactionRepository.findByReferenceIdAndTransactionType(referenceId, transactionType);
        } catch (IncorrectResultSizeDataAccessException ex) {
            return walletTransactionRepository.findFirstByReferenceIdAndTransactionTypeOrderByIdAsc(
                    referenceId,
                    transactionType);
        }
    }

    private void publishPaymentCompleted(Payment payment) {
        try {
            PaymentCompletedEvent event = new PaymentCompletedEvent(
                    payment.getId(),
                    payment.getOrderId(),
                    payment.getDealerId(),
                    payment.getFarmerId(),
                    payment.getAmount(),
                    payment.getPaymentMethod(),
                    payment.getTransactionReference()
            );

            rabbitTemplate.convertAndSend(
                    NotificationRabbitConfig.NOTIFICATION_EXCHANGE,
                    NotificationRabbitConfig.PAYMENT_COMPLETED_ROUTING_KEY,
                    event
            );
        } catch (Exception e) {
            log.warn("Failed to publish payment notification for order {}: {}",
                    payment.getOrderId(), e.getMessage());
        }
    }

    private PaymentResponse mapToResponse(Payment payment) {
        PaymentResponse response = new PaymentResponse();
        response.setId(payment.getId());
        response.setOrderId(payment.getOrderId());
        response.setDealerId(payment.getDealerId());
        response.setFarmerId(payment.getFarmerId());
        response.setAmount(payment.getAmount());
        response.setPaymentMethod(payment.getPaymentMethod());
        response.setStatus(payment.getStatus().name());
        response.setTransactionReference(payment.getTransactionReference());
        response.setPaidAt(payment.getPaidAt());
        return response;
    }

    private WalletResponse mapToWalletResponse(Wallet wallet) {
        WalletResponse response = new WalletResponse();
        response.setId(wallet.getId());
        response.setUserId(wallet.getUserId());
        response.setUserRole(wallet.getUserRole());
        response.setBalance(wallet.getBalance());
        response.setCurrency(wallet.getCurrency());

        if (wallet.getId() != null) {
            List<WalletTransaction> transactions =
                    walletTransactionRepository.findByWalletId(wallet.getId());

            List<WalletTransactionResponse> txResponses = transactions.stream()
                    .map(tx -> {
                        WalletTransactionResponse tr = new WalletTransactionResponse();
                        tr.setId(tx.getId());
                        tr.setWalletId(tx.getWalletId());
                        tr.setUserId(tx.getUserId());
                        tr.setAmount(tx.getAmount());
                        tr.setTransactionType(tx.getTransactionType());
                        tr.setReferenceId(tx.getReferenceId());
                        tr.setStatus(tx.getStatus());
                        tr.setDescription(tx.getDescription());
                        tr.setCreatedAt(tx.getCreatedAt());
                        return tr;
                    })
                    .collect(Collectors.toList());

            response.setTransactions(txResponses);
        }

        return response;
    }
}
