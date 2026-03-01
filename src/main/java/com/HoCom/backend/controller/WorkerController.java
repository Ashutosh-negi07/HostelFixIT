package com.HoCom.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.HoCom.backend.dto.*;
import com.HoCom.backend.models.Complaint;
import com.HoCom.backend.models.User;
import com.HoCom.backend.service.ComplaintService;
import com.HoCom.backend.service.FeedbackService;
import com.HoCom.backend.service.UserService;

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
    public ResponseEntity<PagedResponse<ComplaintResponse>> getMyAssignedComplaints(
            @RequestParam(required = false) Complaint.Status status,
            @RequestParam(required = false) Complaint.Priority priority,
            @RequestParam(required = false, defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(complaintService.getWorkerComplaints(currentUser, status, priority, sortBy, order, page, size));
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
