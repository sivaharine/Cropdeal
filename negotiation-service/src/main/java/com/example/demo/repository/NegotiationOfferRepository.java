package com.example.demo.repository;

import com.example.demo.entity.NegotiationOffer;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NegotiationOfferRepository extends JpaRepository<NegotiationOffer, Long> {

    List<NegotiationOffer> findByNegotiationIdOrderByCreatedAtAsc(Long negotiationId);
}
