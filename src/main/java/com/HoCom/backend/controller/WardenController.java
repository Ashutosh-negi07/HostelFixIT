package com.HoCom.backend.controller;

import com.HoCom.backend.dto.AssignWorkerRequest;
import com.HoCom.backend.dto.ComplaintResponse;
import com.HoCom.backend.models.users;
import com.HoCom.backend.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/warden")
@RequiredArgsConstructor
public class WardenController {

    private final ComplaintService complaintService;

    // ─── Complaints in warden's hostel ───

    @GetMapping("/complaints")
    public ResponseEntity<List<ComplaintResponse>> getHostelComplaints(@AuthenticationPrincipal users currentUser) {
        return ResponseEntity.ok(complaintService.getComplaintsByHostel(currentUser));
    }

    @GetMapping("/complaints/{complaintId}")
    public ResponseEntity<ComplaintResponse> getComplaint(@PathVariable UUID complaintId,
                                                          @AuthenticationPrincipal users currentUser) {
        return ResponseEntity.ok(complaintService.getComplaintById(complaintId, currentUser));
    }

    // ─── Assign worker to complaint ───

    @PutMapping("/complaints/{complaintId}/assign")
    public ResponseEntity<ComplaintResponse> assignWorker(@PathVariable UUID complaintId,
                                                          @Valid @RequestBody AssignWorkerRequest request,
                                                          @AuthenticationPrincipal users currentUser) {
        ComplaintResponse response = complaintService.assignWorker(complaintId, request.getWorkerId(), currentUser);
        return ResponseEntity.ok(response);
    }

    // ─── Reject complaint ───

    @PutMapping("/complaints/{complaintId}/reject")
    public ResponseEntity<ComplaintResponse> rejectComplaint(@PathVariable UUID complaintId,
                                                              @AuthenticationPrincipal users currentUser) {
        ComplaintResponse response = complaintService.rejectComplaint(complaintId, currentUser);
        return ResponseEntity.ok(response);
    }
}
