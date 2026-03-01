package com.HoCom.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.HoCom.backend.dto.*;
import com.HoCom.backend.models.Complaint;
import com.HoCom.backend.models.ComplaintStatusHistory;
import com.HoCom.backend.models.User;
import com.HoCom.backend.models.User.Role;
import com.HoCom.backend.repositories.ComplaintStatusHistoryRepository;
import com.HoCom.backend.service.AuthService;
import com.HoCom.backend.service.ComplaintService;
import com.HoCom.backend.service.FeedbackService;
import com.HoCom.backend.service.UserService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/warden")
@RequiredArgsConstructor
public class WardenController {

    private final ComplaintService complaintService;
    private final AuthService authService;
    private final UserService userService;
    private final FeedbackService feedbackService;
    private final ComplaintStatusHistoryRepository statusHistoryRepository;

    // ═══════════════════════════════════════════
    //  STUDENT & WORKER MANAGEMENT
    // ═══════════════════════════════════════════

    @PostMapping("/users")
    public ResponseEntity<AuthResponse> createUser(@Valid @RequestBody CreateUserRequest request,
                                                   @AuthenticationPrincipal User currentUser) {
        // Force hostel to warden's own hostel
        if (currentUser.getHostel() == null) {
            throw new RuntimeException("Warden is not assigned to a hostel");
        }
        request.setHostelId(currentUser.getHostel().getId());
        AuthResponse response = authService.createUser(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/students")
    public ResponseEntity<PagedResponse<UserResponse>> getStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser.getHostel() == null) {
            throw new RuntimeException("Warden is not assigned to a hostel");
        }
        return ResponseEntity.ok(userService.getUsersByHostelAndRole(currentUser.getHostel().getId(), Role.STUDENT, page, size));
    }

    @GetMapping("/workers")
    public ResponseEntity<PagedResponse<UserResponse>> getWorkers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser.getHostel() == null) {
            throw new RuntimeException("Warden is not assigned to a hostel");
        }
        return ResponseEntity.ok(userService.getUsersByHostelAndRole(currentUser.getHostel().getId(), Role.WORKER, page, size));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID userId,
                                                    @AuthenticationPrincipal User currentUser) {
        if (currentUser.getHostel() == null) {
            throw new RuntimeException("Warden is not assigned to a hostel");
        }
        UserResponse user = userService.getUserById(userId);
        // Only allow viewing users in the warden's own hostel
        if (user.getHostelId() == null || !user.getHostelId().equals(currentUser.getHostel().getId())) {
            throw new RuntimeException("Warden can only manage users in their own hostel");
        }
        return ResponseEntity.ok(user);
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable UUID userId,
                                                   @Valid @RequestBody UpdateUserRequest request,
                                                   @AuthenticationPrincipal User currentUser) {
        // Warden cannot change role or hostel
        request.setRole(null);
        request.setHostelId(null);
        return ResponseEntity.ok(userService.updateUser(userId, request, currentUser));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable UUID userId,
                                                          @AuthenticationPrincipal User currentUser) {
        userService.deleteUser(userId, currentUser);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    // ═══════════════════════════════════════════
    //  COMPLAINT MANAGEMENT
    // ═══════════════════════════════════════════

    @GetMapping("/complaints")
    public ResponseEntity<PagedResponse<ComplaintResponse>> getHostelComplaints(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false, defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal User currentUser) {

        Complaint.Status statusEnum = status != null ? Complaint.Status.valueOf(status.toUpperCase()) : null;
        Complaint.Priority priorityEnum = priority != null ? Complaint.Priority.valueOf(priority.toUpperCase()) : null;

        return ResponseEntity.ok(complaintService.getComplaintsByHostelFiltered(
                currentUser, statusEnum, priorityEnum, categoryId, sortBy, order, page, size));
    }

    @GetMapping("/complaints/{complaintId}")
    public ResponseEntity<ComplaintResponse> getComplaint(@PathVariable UUID complaintId,
                                                          @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(complaintService.getComplaintById(complaintId, currentUser));
    }

    // ─── Assign worker to complaint ───

    @PutMapping("/complaints/{complaintId}/assign")
    public ResponseEntity<ComplaintResponse> assignWorker(@PathVariable UUID complaintId,
                                                          @Valid @RequestBody AssignWorkerRequest request,
                                                          @AuthenticationPrincipal User currentUser) {
        ComplaintResponse response = complaintService.assignWorker(complaintId, request.getWorkerId(), currentUser);
        return ResponseEntity.ok(response);
    }

    // ─── Reject complaint ───

    @PutMapping("/complaints/{complaintId}/reject")
    public ResponseEntity<ComplaintResponse> rejectComplaint(@PathVariable UUID complaintId,
                                                              @AuthenticationPrincipal User currentUser) {
        ComplaintResponse response = complaintService.rejectComplaint(complaintId, currentUser);
        return ResponseEntity.ok(response);
    }

    // ─── Feedback visibility ───

    @GetMapping("/complaints/{complaintId}/feedback")
    public ResponseEntity<FeedbackResponse> getFeedback(@PathVariable UUID complaintId,
                                                        @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(feedbackService.getFeedbackByComplaintId(complaintId, currentUser));
    }

    // ─── Status history ───

    @GetMapping("/complaints/{complaintId}/history")
    public ResponseEntity<List<ComplaintStatusHistoryResponse>> getComplaintHistory(
            @PathVariable UUID complaintId,
            @AuthenticationPrincipal User currentUser) {
        List<ComplaintStatusHistory> history = statusHistoryRepository
                .findByComplaintIdOrderByChangedAtAsc(complaintId);
        List<ComplaintStatusHistoryResponse> response = history.stream()
                .map(h -> ComplaintStatusHistoryResponse.builder()
                        .id(h.getId())
                        .complaintId(h.getComplaint().getId())
                        .oldStatus(h.getOldStatus())
                        .newStatus(h.getNewStatus())
                        .changedById(h.getChangedBy().getId())
                        .changedByName(h.getChangedBy().getName())
                        .changedAt(h.getChangedAt())
                        .build())
                .toList();
        return ResponseEntity.ok(response);
    }
}
