package com.cropdeal.admin.service;

import com.cropdeal.admin.dto.DashboardSummaryResponse;
import com.cropdeal.admin.dto.OrdersByStatusResponse;
import com.cropdeal.admin.dto.RevenueSummaryResponse;

public interface DashboardService {
    DashboardSummaryResponse getSummary();
    OrdersByStatusResponse getOrdersByStatus();
    RevenueSummaryResponse getRevenueSummary();
}
