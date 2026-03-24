package com.HoCom.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.HoCom.backend.dto.*;
import com.HoCom.backend.models.Complaint;
import com.HoCom.backend.models.User;
import com.HoCom.backend.service.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentController {

    private final ComplaintService complaintService;
    private final FeedbackService feedbackService;
    private final CloudinaryService cloudinaryService;
    private final CategoryService categoryService;
    private final UserService userService;
    private final HostelService hostelService;

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
        // Students can only update their own name, phone, password — not role/hostel/isActive
        UpdateUserRequest safeRequest = UpdateUserRequest.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .oldPassword(request.getOldPassword())
                .password(request.getPassword())
                .build();
        return ResponseEntity.ok(userService.updateUser(currentUser.getId(), safeRequest, currentUser));
    }

    // ═══════════════════════════════════════════
    //  CATEGORIES (read-only for complaint creation)
    // ═══════════════════════════════════════════

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    // ═══════════════════════════════════════════
    //  COMPLAINTS
    // ═══════════════════════════════════════════

    @PostMapping(value = "/complaints", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ComplaintResponse> createComplaint(
            @RequestParam UUID categoryId,
            @RequestParam String description,
            @RequestParam(required = false) String priority,
            @RequestPart(required = false) MultipartFile photo,
            @AuthenticationPrincipal User currentUser) {

        String photoUrl = null;
        if (photo != null && !photo.isEmpty()) {
            photoUrl = cloudinaryService.upload(photo);
        }

        CreateComplaintRequest request = CreateComplaintRequest.builder()
                .categoryId(categoryId)
                .description(description)
                .photoUrl(photoUrl)
                .priority(priority != null
                        ? Complaint.Priority.valueOf(priority.toUpperCase())
                        : Complaint.Priority.NORMAL)
                .build();

        ComplaintResponse response = complaintService.createComplaint(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/complaints")
    public ResponseEntity<PagedResponse<ComplaintResponse>> getMyComplaints(
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

        return ResponseEntity.ok(complaintService.getMyComplaints(currentUser, statusEnum, priorityEnum, categoryId, sortBy, order, page, size));
    }

    @GetMapping("/complaints/{complaintId}")
    public ResponseEntity<ComplaintResponse> getComplaint(@PathVariable UUID complaintId,
                                                          @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(complaintService.getComplaintById(complaintId, currentUser));
    }

    @PutMapping(value = "/complaints/{complaintId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ComplaintResponse> updateComplaint(
            @PathVariable UUID complaintId,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String priority,
            @RequestPart(required = false) MultipartFile photo,
            @AuthenticationPrincipal User currentUser) {

        String photoUrl = null;
        if (photo != null && !photo.isEmpty()) {
            photoUrl = cloudinaryService.upload(photo);
        }

        UpdateComplaintRequest request = UpdateComplaintRequest.builder()
                .categoryId(categoryId)
                .description(description)
                .priority(priority != null ? Complaint.Priority.valueOf(priority.toUpperCase()) : null)
                .build();

        ComplaintResponse response = complaintService.updateComplaint(complaintId, request, photoUrl, currentUser);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/complaints/{complaintId}")
    public ResponseEntity<Map<String, String>> cancelComplaint(@PathVariable UUID complaintId,
                                                               @AuthenticationPrincipal User currentUser) {
        complaintService.cancelComplaint(complaintId, currentUser);
        return ResponseEntity.ok(Map.of("message", "Complaint cancelled successfully"));
    }

    // ═══════════════════════════════════════════
    //  FEEDBACK
    // ═══════════════════════════════════════════

    @PostMapping("/feedback")
    public ResponseEntity<FeedbackResponse> createFeedback(@Valid @RequestBody CreateFeedbackRequest request,
                                                            @AuthenticationPrincipal User currentUser) {
        FeedbackResponse response = feedbackService.createFeedback(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/complaints/{complaintId}/feedback")
    public ResponseEntity<FeedbackResponse> getFeedback(@PathVariable UUID complaintId,
                                                        @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(feedbackService.getFeedbackByComplaintId(complaintId, currentUser));
    }

    // ═══════════════════════════════════════════
    //  COMPLAINT COUNTS
    // ═══════════════════════════════════════════

    @GetMapping("/complaints/count")
    public ResponseEntity<ComplaintCountResponse> getComplaintCounts(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(complaintService.getStudentComplaintCounts(currentUser));
    }

    // ═══════════════════════════════════════════
    //  HOSTEL
    // ═══════════════════════════════════════════

    @GetMapping("/hostel")
    public ResponseEntity<HostelResponse> getMyHostel(@AuthenticationPrincipal User currentUser) {
        if (currentUser.getHostel() == null) {
            throw new RuntimeException("Student is not assigned to a hostel");
        }
        return ResponseEntity.ok(hostelService.getHostelById(currentUser.getHostel().getId()));
    }
}
