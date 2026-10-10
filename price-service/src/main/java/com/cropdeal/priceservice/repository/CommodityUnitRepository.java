package com.cropdeal.priceservice.repository;

import com.cropdeal.priceservice.entity.CommodityUnit;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommodityUnitRepository extends JpaRepository<CommodityUnit, Long> {
    Optional<CommodityUnit> findByCommodityIgnoreCaseAndVarietyIgnoreCase(String commodity, String variety);
}
