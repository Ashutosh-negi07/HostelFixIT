package com.HoCom.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.HoCom.backend.dto.ComplaintResponse;
import com.HoCom.backend.models.users;
import com.HoCom.backend.service.ComplaintService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/worker")
@RequiredArgsConstructor
public class WorkerController {

    private final ComplaintService complaintService;

    // ─── Get my assigned complaints ───

    @GetMapping("/complaints")
    public ResponseEntity<List<ComplaintResponse>> getMyAssignedComplaints(@AuthenticationPrincipal users currentUser) {
        return ResponseEntity.ok(complaintService.getComplaintsByWorker(currentUser));
    }

    // ─── Mark complaint as resolved ───

    @PutMapping("/complaints/{complaintId}/resolve")
    public ResponseEntity<ComplaintResponse> resolveComplaint(@PathVariable UUID complaintId,
                                                               @AuthenticationPrincipal users currentUser) {
        ComplaintResponse response = complaintService.resolveComplaint(complaintId, currentUser);
        return ResponseEntity.ok(response);
    }
}
