package com.HoCom.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.HoCom.backend.dto.DashboardStatsResponse;
import com.HoCom.backend.models.User;
import com.HoCom.backend.models.User.Role;
import com.HoCom.backend.service.DashboardService;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(
            @AuthenticationPrincipal User currentUser) {

        if (currentUser.getRole() == Role.ADMIN) {
            return ResponseEntity.ok(dashboardService.getAdminDashboardStats());
        } else if (currentUser.getRole() == Role.WARDEN) {
            return ResponseEntity.ok(dashboardService.getWardenDashboardStats(currentUser));
        } else {
            throw new RuntimeException("Only ADMIN and WARDEN can access dashboard stats");
        }
    }
}
