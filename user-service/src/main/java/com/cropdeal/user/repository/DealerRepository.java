package com.cropdeal.user.repository;

import com.cropdeal.user.entity.Dealer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DealerRepository
        extends JpaRepository<Dealer, Long> {

    Optional<Dealer> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}