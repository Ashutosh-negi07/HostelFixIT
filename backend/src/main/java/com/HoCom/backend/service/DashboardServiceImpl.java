package com.HoCom.backend.service;

import com.HoCom.backend.dto.DashboardStatsResponse;
import com.HoCom.backend.models.Complaint;
import com.HoCom.backend.models.User;
import com.HoCom.backend.models.User.Role;
import com.HoCom.backend.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final HostelRepository hostelRepository;
    private final FeedbackRepository feedbackRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public DashboardStatsResponse getAdminDashboardStats() {
        long totalComplaints = complaintRepository.count();
        long pendingComplaints = complaintRepository.countByStatus(Complaint.Status.PENDING);
        long assignedComplaints = complaintRepository.countByStatus(Complaint.Status.ASSIGNED);
        long inProgressComplaints = complaintRepository.countByStatus(Complaint.Status.IN_PROGRESS);
        long resolvedComplaints = complaintRepository.countByStatus(Complaint.Status.RESOLVED);
        long rejectedComplaints = complaintRepository.countByStatus(Complaint.Status.REJECTED);

        long totalUsers = userRepository.count();
        long totalStudents = userRepository.countByRole(Role.STUDENT);
        long totalWorkers = userRepository.countByRole(Role.WORKER);
        long totalWardens = userRepository.countByRole(Role.WARDEN);
        long totalHostels = hostelRepository.count();
        long totalCategories = categoryRepository.count();
        long totalFeedbacks = feedbackRepository.count();

        Double averageRating = feedbackRepository.findAverageRating();

        Map<String, Long> complaintsByStatus = new LinkedHashMap<>();
        complaintsByStatus.put("PENDING", pendingComplaints);
        complaintsByStatus.put("ASSIGNED", assignedComplaints);
        complaintsByStatus.put("IN_PROGRESS", inProgressComplaints);
        complaintsByStatus.put("RESOLVED", resolvedComplaints);
        complaintsByStatus.put("REJECTED", rejectedComplaints);

        Map<String, Long> usersByRole = new LinkedHashMap<>();
        usersByRole.put("STUDENT", totalStudents);
        usersByRole.put("WORKER", totalWorkers);
        usersByRole.put("WARDEN", totalWardens);

        return DashboardStatsResponse.builder()
                .totalComplaints(totalComplaints)
                .pendingComplaints(pendingComplaints)
                .assignedComplaints(assignedComplaints)
                .inProgressComplaints(inProgressComplaints)
                .resolvedComplaints(resolvedComplaints)
                .rejectedComplaints(rejectedComplaints)
                .totalUsers(totalUsers)
                .totalHostels(totalHostels)
                .totalCategories(totalCategories)
                .totalFeedbacks(totalFeedbacks)
                .averageRating(averageRating != null ? averageRating : 0.0)
                .complaintsByStatus(complaintsByStatus)
                .usersByRole(usersByRole)
                .build();
    }

    @Override
    public DashboardStatsResponse getWardenDashboardStats(User warden) {
        if (warden.getHostel() == null) {
            throw new RuntimeException("Warden is not assigned to a hostel");
        }

        UUID hostelId = warden.getHostel().getId();

        long totalComplaints = complaintRepository.countByHostelId(hostelId);
        long pendingComplaints = complaintRepository.countByHostelIdAndStatus(hostelId, Complaint.Status.PENDING);
        long assignedComplaints = complaintRepository.countByHostelIdAndStatus(hostelId, Complaint.Status.ASSIGNED);
        long inProgressComplaints = complaintRepository.countByHostelIdAndStatus(hostelId, Complaint.Status.IN_PROGRESS);
        long resolvedComplaints = complaintRepository.countByHostelIdAndStatus(hostelId, Complaint.Status.RESOLVED);
        long rejectedComplaints = complaintRepository.countByHostelIdAndStatus(hostelId, Complaint.Status.REJECTED);

        long totalStudents = userRepository.countByHostelIdAndRole(hostelId, Role.STUDENT);
        long totalWorkers = userRepository.countByHostelIdAndRole(hostelId, Role.WORKER);

        Map<String, Long> complaintsByStatus = new LinkedHashMap<>();
        complaintsByStatus.put("PENDING", pendingComplaints);
        complaintsByStatus.put("ASSIGNED", assignedComplaints);
        complaintsByStatus.put("IN_PROGRESS", inProgressComplaints);
        complaintsByStatus.put("RESOLVED", resolvedComplaints);
        complaintsByStatus.put("REJECTED", rejectedComplaints);

        Map<String, Long> usersByRole = new LinkedHashMap<>();
        usersByRole.put("STUDENT", totalStudents);
        usersByRole.put("WORKER", totalWorkers);

        long totalFeedbacks = feedbackRepository.countByComplaintHostelId(hostelId);
        Double averageRating = feedbackRepository.findAverageRatingByHostelId(hostelId);
        long totalCategories = categoryRepository.count();

        return DashboardStatsResponse.builder()
                .totalComplaints(totalComplaints)
                .pendingComplaints(pendingComplaints)
                .assignedComplaints(assignedComplaints)
                .inProgressComplaints(inProgressComplaints)
                .resolvedComplaints(resolvedComplaints)
                .rejectedComplaints(rejectedComplaints)
                .totalUsers(totalStudents + totalWorkers)
                .totalHostels(1L)
                .totalCategories(totalCategories)
                .totalFeedbacks(totalFeedbacks)
                .averageRating(averageRating != null ? averageRating : 0.0)
                .complaintsByStatus(complaintsByStatus)
                .usersByRole(usersByRole)
                .build();
    }
}
