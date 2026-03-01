package com.HoCom.Fixit.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.HoCom.Fixit.dto.*;
import com.HoCom.Fixit.models.Complaint;
import com.HoCom.Fixit.models.User;
import com.HoCom.Fixit.service.ComplaintService;
import com.HoCom.Fixit.service.FeedbackService;
import com.HoCom.Fixit.service.UserService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/worker")
@RequiredArgsConstructor
public class WorkerController {

    private final ComplaintService complaintService;
    private final FeedbackService feedbackService;
    private final UserService userService;

    // ═══════════════════════════════════════════
    //  PROFILE
    // ═══════════════════════════════════════════

    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getProfile(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.getUserById(currentUser.getId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody UpdateUserRequest request,
                                                      @AuthenticationPrincipal User currentUser) {
        // Workers can only update name, phone, and password
        UpdateUserRequest safeRequest = UpdateUserRequest.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .oldPassword(request.getOldPassword())
                .password(request.getPassword())
                .build();
        return ResponseEntity.ok(userService.updateUser(currentUser.getId(), safeRequest, currentUser));
    }

    // ═══════════════════════════════════════════
    //  COMPLAINTS
    // ═══════════════════════════════════════════

    @GetMapping("/complaints")
    public ResponseEntity<List<ComplaintResponse>> getMyAssignedComplaints(
            @RequestParam(required = false) Complaint.Status status,
            @RequestParam(required = false) Complaint.Priority priority,
            @RequestParam(required = false, defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String order,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(complaintService.getWorkerComplaints(currentUser, status, priority, sortBy, order));
    }

    @GetMapping("/complaints/{complaintId}")
    public ResponseEntity<ComplaintResponse> getComplaint(@PathVariable UUID complaintId,
                                                          @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(complaintService.getComplaintById(complaintId, currentUser));
    }

    @PutMapping("/complaints/{complaintId}/in-progress")
    public ResponseEntity<ComplaintResponse> startProgress(@PathVariable UUID complaintId,
                                                            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(complaintService.startProgress(complaintId, currentUser));
    }

    @PutMapping("/complaints/{complaintId}/resolve")
    public ResponseEntity<ComplaintResponse> resolveComplaint(@PathVariable UUID complaintId,
                                                               @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(complaintService.resolveComplaint(complaintId, currentUser));
    }

    // ═══════════════════════════════════════════
    //  FEEDBACK VISIBILITY
    // ═══════════════════════════════════════════

    @GetMapping("/complaints/{complaintId}/feedback")
    public ResponseEntity<FeedbackResponse> getFeedback(@PathVariable UUID complaintId,
                                                        @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(feedbackService.getFeedbackByComplaintId(complaintId, currentUser));
    }
}
