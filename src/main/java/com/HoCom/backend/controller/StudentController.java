package com.HoCom.backend.controller;

import com.HoCom.backend.dto.*;
import com.HoCom.backend.models.users;
import com.HoCom.backend.service.CloudinaryService;
import com.HoCom.backend.service.ComplaintService;
import com.HoCom.backend.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentController {

    private final ComplaintService complaintService;
    private final FeedbackService feedbackService;
    private final CloudinaryService cloudinaryService;

    // ─── Complaints ───

    @PostMapping(value = "/complaints", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ComplaintResponse> createComplaint(
            @RequestParam UUID categoryId,
            @RequestParam String description,
            @RequestParam(required = false) String priority,
            @RequestPart(required = false) MultipartFile photo,
            @AuthenticationPrincipal users currentUser) {

        String photoUrl = null;
        if (photo != null && !photo.isEmpty()) {
            photoUrl = cloudinaryService.upload(photo);
        }

        CreateComplaintRequest request = CreateComplaintRequest.builder()
                .categoryId(categoryId)
                .description(description)
                .photoUrl(photoUrl)
                .priority(priority != null
                        ? com.HoCom.backend.models.Complaint.Priority.valueOf(priority.toUpperCase())
                        : com.HoCom.backend.models.Complaint.Priority.NORMAL)
                .build();

        ComplaintResponse response = complaintService.createComplaint(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/complaints")
    public ResponseEntity<List<ComplaintResponse>> getMyComplaints(@AuthenticationPrincipal users currentUser) {
        return ResponseEntity.ok(complaintService.getMyComplaints(currentUser));
    }

    @GetMapping("/complaints/{complaintId}")
    public ResponseEntity<ComplaintResponse> getComplaint(@PathVariable UUID complaintId,
                                                          @AuthenticationPrincipal users currentUser) {
        return ResponseEntity.ok(complaintService.getComplaintById(complaintId, currentUser));
    }

    // ─── Feedback ───

    @PostMapping("/feedback")
    public ResponseEntity<FeedbackResponse> createFeedback(@Valid @RequestBody CreateFeedbackRequest request,
                                                            @AuthenticationPrincipal users currentUser) {
        FeedbackResponse response = feedbackService.createFeedback(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/complaints/{complaintId}/feedback")
    public ResponseEntity<FeedbackResponse> getFeedback(@PathVariable UUID complaintId,
                                                        @AuthenticationPrincipal users currentUser) {
        return ResponseEntity.ok(feedbackService.getFeedbackByComplaintId(complaintId, currentUser));
    }
}
