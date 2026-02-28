package com.HoCom.backend.service;

import com.HoCom.backend.dto.DashboardStatsResponse;
import com.HoCom.backend.models.User;

public interface DashboardService {

    DashboardStatsResponse getAdminDashboardStats();

    DashboardStatsResponse getWardenDashboardStats(User warden);
}
