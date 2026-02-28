package com.HoCom.backend.dto;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsResponse {

    private long totalComplaints;
    private long pendingComplaints;
    private long assignedComplaints;
    private long inProgressComplaints;
    private long resolvedComplaints;
    private long rejectedComplaints;

    private long totalUsers;
    private long totalHostels;
    private long totalCategories;
    private long totalFeedbacks;

    private double averageRating;

    private Map<String, Long> complaintsByStatus;
    private Map<String, Long> usersByRole;
}
