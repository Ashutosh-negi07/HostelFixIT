package com.HoCom.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.HoCom.backend.dto.*;
import com.HoCom.backend.models.Complaint;
import com.HoCom.backend.models.User;
import com.HoCom.backend.models.User.Role;
import com.HoCom.backend.service.AuthService;
import com.HoCom.backend.service.CategoryService;
import com.HoCom.backend.service.ComplaintService;
import com.HoCom.backend.service.FeedbackService;
import com.HoCom.backend.service.HostelService;
import com.HoCom.backend.service.UserService;
import com.HoCom.backend.repositories.ComplaintStatusHistoryRepository;
import com.HoCom.backend.models.ComplaintStatusHistory;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AuthService authService;
    private final HostelService hostelService;
    private final UserService userService;
    private final CategoryService categoryService;
    private final ComplaintService complaintService;
    private final FeedbackService feedbackService;
    private final ComplaintStatusHistoryRepository statusHistoryRepository;

    // ═══════════════════════════════════════════
    //  USER MANAGEMENT
    // ═══════════════════════════════════════════

    @PostMapping("/users")
    public ResponseEntity<AuthResponse> createUser(@Valid @RequestBody CreateUserRequest request,
                                                   @AuthenticationPrincipal User currentUser) {
        AuthResponse response = authService.createUser(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/users")
    public ResponseEntity<PagedResponse<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getAllUsers(page, size));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    @GetMapping("/users/role/{role}")
    public ResponseEntity<PagedResponse<UserResponse>> getUsersByRole(
            @PathVariable Role role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getUsersByRole(role, page, size));
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable UUID userId,
                                                   @Valid @RequestBody UpdateUserRequest request,
                                                   @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.updateUser(userId, request, currentUser));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable UUID userId,
                                                          @AuthenticationPrincipal User currentUser) {
        userService.deleteUser(userId, currentUser);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    @PutMapping("/users/{userId}/toggle-active")
    public ResponseEntity<UserResponse> toggleActive(@PathVariable UUID userId,
                                                     @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.toggleActive(userId, currentUser));
    }

    // ═══════════════════════════════════════════
    //  HOSTEL MANAGEMENT
    // ═══════════════════════════════════════════

    @PostMapping("/hostels")
    public ResponseEntity<HostelResponse> createHostel(@Valid @RequestBody CreateHostelRequest request,
                                                       @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(hostelService.createHostel(request, currentUser));
    }

    @GetMapping("/hostels")
    public ResponseEntity<List<HostelResponse>> getAllHostels(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(hostelService.getScopedHostels(currentUser));
    }

    @GetMapping("/hostels/{hostelId}")
    public ResponseEntity<HostelResponse> getHostelById(@PathVariable UUID hostelId) {
        return ResponseEntity.ok(hostelService.getHostelById(hostelId));
    }

    @GetMapping("/hostels/{hostelId}/wardens")
    public ResponseEntity<PagedResponse<UserResponse>> getWardensByHostel(
            @PathVariable UUID hostelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getUsersByHostelAndRole(hostelId, Role.WARDEN, page, size));
    }

    @GetMapping("/hostels/{hostelId}/students")
    public ResponseEntity<PagedResponse<UserResponse>> getStudentsByHostel(
            @PathVariable UUID hostelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getUsersByHostelAndRole(hostelId, Role.STUDENT, page, size));
    }

    @GetMapping("/hostels/{hostelId}/workers")
    public ResponseEntity<PagedResponse<UserResponse>> getWorkersByHostel(
            @PathVariable UUID hostelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getUsersByHostelAndRole(hostelId, Role.WORKER, page, size));
    }

    @PutMapping("/hostels/{hostelId}")
    public ResponseEntity<HostelResponse> updateHostel(@PathVariable UUID hostelId,
                                                       @Valid @RequestBody UpdateHostelRequest request,
                                                       @AuthenticationPrincipal User currentUser) {
        // ADMIN can only update their own hostels; SUPER_ADMIN can update any
        if (currentUser.getRole() == Role.ADMIN) {
            List<UUID> myIds = hostelService.getScopedHostelIds(currentUser);
            if (!myIds.contains(hostelId)) {
                throw new RuntimeException("You do not have permission to update this hostel");
            }
        }
        return ResponseEntity.ok(hostelService.updateHostel(hostelId, request));
    }

    @DeleteMapping("/hostels/{hostelId}")
    public ResponseEntity<Map<String, String>> deleteHostel(@PathVariable UUID hostelId,
                                                            @AuthenticationPrincipal User currentUser) {
        // ADMIN can only delete their own hostels; SUPER_ADMIN can delete any
        if (currentUser.getRole() == Role.ADMIN) {
            List<UUID> myIds = hostelService.getScopedHostelIds(currentUser);
            if (!myIds.contains(hostelId)) {
                throw new RuntimeException("You do not have permission to delete this hostel");
            }
        }
        hostelService.deleteHostel(hostelId);
        return ResponseEntity.ok(Map.of("message", "Hostel deleted successfully"));
    }

    // ═══════════════════════════════════════════
    //  CATEGORY MANAGEMENT
    // ═══════════════════════════════════════════

    @PostMapping("/categories")
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CreateCategoryRequest request,
                                                           @AuthenticationPrincipal User currentUser) {
        // Both ADMIN and SUPER_ADMIN can manage categories
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createCategory(request));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @GetMapping("/categories/{categoryId}")
    public ResponseEntity<CategoryResponse> getCategoryById(@PathVariable UUID categoryId) {
        return ResponseEntity.ok(categoryService.getCategoryById(categoryId));
    }

    @PutMapping("/categories/{categoryId}")
    public ResponseEntity<CategoryResponse> updateCategory(@PathVariable UUID categoryId,
                                                           @Valid @RequestBody UpdateCategoryRequest request,
                                                           @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(categoryService.updateCategory(categoryId, request));
    }

    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<Map<String, String>> deleteCategory(@PathVariable UUID categoryId,
                                                              @AuthenticationPrincipal User currentUser) {
        categoryService.deleteCategory(categoryId);
        return ResponseEntity.ok(Map.of("message", "Category deleted successfully"));
    }

    // ═══════════════════════════════════════════
    //  COMPLAINT MANAGEMENT
    // ═══════════════════════════════════════════

    @GetMapping("/complaints")
    public ResponseEntity<PagedResponse<ComplaintResponse>> getAllComplaints(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) UUID hostelId,
            @RequestParam(required = false, defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Complaint.Status statusEnum = status != null ? Complaint.Status.valueOf(status.toUpperCase()) : null;
        Complaint.Priority priorityEnum = priority != null ? Complaint.Priority.valueOf(priority.toUpperCase()) : null;

        return ResponseEntity.ok(complaintService.getAllComplaints(statusEnum, priorityEnum, hostelId, sortBy, order, page, size));
    }

    @GetMapping("/complaints/{complaintId}")
    public ResponseEntity<ComplaintResponse> getComplaintById(@PathVariable UUID complaintId,
                                                              @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(complaintService.getComplaintById(complaintId, currentUser));
    }

    // ═══════════════════════════════════════════
    //  FEEDBACK
    // ═══════════════════════════════════════════

    @GetMapping("/complaints/{complaintId}/feedback")
    public ResponseEntity<FeedbackResponse> getFeedback(@PathVariable UUID complaintId,
                                                        @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(feedbackService.getFeedbackByComplaintId(complaintId, currentUser));
    }

    // ═══════════════════════════════════════════
    //  COMPLAINT STATUS HISTORY
    // ═══════════════════════════════════════════

    @GetMapping("/complaints/{complaintId}/history")
    public ResponseEntity<List<ComplaintStatusHistoryResponse>> getComplaintHistory(
            @PathVariable UUID complaintId) {
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
