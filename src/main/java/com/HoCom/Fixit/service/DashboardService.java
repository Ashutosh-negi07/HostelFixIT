package com.HoCom.Fixit.service;

import com.HoCom.Fixit.dto.DashboardStatsResponse;
import com.HoCom.Fixit.models.User;

public interface DashboardService {

    DashboardStatsResponse getAdminDashboardStats();

    DashboardStatsResponse getWardenDashboardStats(User warden);
}
