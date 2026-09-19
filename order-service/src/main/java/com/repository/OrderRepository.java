package com.repository;

import com.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByDealerId(Long dealerId);

    List<Order> findByFarmerId(Long farmerId);
}