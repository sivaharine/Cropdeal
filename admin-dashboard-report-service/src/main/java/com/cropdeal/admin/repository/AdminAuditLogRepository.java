package com.cropdeal.admin.repository;

import com.cropdeal.admin.entity.AdminAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {
    List<AdminAuditLog> findTop50ByOrderByTimestampDesc();
    List<AdminAuditLog> findByTargetEntityOrderByTimestampDesc(String targetEntity);
}
