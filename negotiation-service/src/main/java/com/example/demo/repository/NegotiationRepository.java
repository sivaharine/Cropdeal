package com.example.demo.repository;

import com.example.demo.entity.Negotiation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NegotiationRepository extends JpaRepository<Negotiation, Long> {

    List<Negotiation> findByBuyerIdOrSellerId(Long buyerId, Long sellerId);
}
