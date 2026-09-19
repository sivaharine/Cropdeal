package com.cropdeal.user.repository;

import com.cropdeal.user.entity.DeliveryPartner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryPartnerRepository extends JpaRepository<DeliveryPartner, Long> {

    Optional<DeliveryPartner> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    boolean existsByVehicleNumber(String vehicleNumber);

    boolean existsByDrivingLicenseNumber(String drivingLicenseNumber);
}
