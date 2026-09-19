package com.cropdeal.admin.repository;

import com.cropdeal.admin.entity.ReportRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportRecordRepository extends JpaRepository<ReportRecord, Long> {
    List<ReportRecord> findTop20ByOrderByGeneratedAtDesc();
}
