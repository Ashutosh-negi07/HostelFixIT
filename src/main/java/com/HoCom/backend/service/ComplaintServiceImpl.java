package com.HoCom.backend.service;

import com.HoCom.backend.dto.ComplaintResponse;
import com.HoCom.backend.dto.CreateComplaintRequest;
import com.HoCom.backend.models.*;
import com.HoCom.backend.models.users.Role;
import com.HoCom.backend.repositories.CategoryRepository;
import com.HoCom.backend.repositories.ComplaintRepository;
import com.HoCom.backend.repositories.ComplaintStatusHistoryRepository;
import com.HoCom.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ComplaintStatusHistoryRepository statusHistoryRepository;

    @Override
    public ComplaintResponse createComplaint(CreateComplaintRequest request, users student) {
        if (student.getRole() != Role.STUDENT) {
            throw new RuntimeException("Only students can create complaints");
        }
        if (student.getHostel() == null) {
            throw new RuntimeException("Student must be assigned to a hostel to file a complaint");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        Complaint complaint = Complaint.builder()
                .student(student)
                .hostel(student.getHostel())
                .category(category)
                .description(request.getDescription())
                .photoUrl(request.getPhotoUrl())
                .priority(request.getPriority())
                .build();

        Complaint saved = complaintRepository.save(complaint);
        return mapToResponse(saved);
    }

    @Override
    public List<ComplaintResponse> getMyComplaints(users student) {
        return complaintRepository.findByStudentId(student.getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public ComplaintResponse getComplaintById(UUID complaintId, users currentUser) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if (currentUser.getRole() == Role.STUDENT
                && !complaint.getStudent().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only view your own complaints");
        }
        if (currentUser.getRole() == Role.WORKER
                && (complaint.getAssignedWorker() == null
                    || !complaint.getAssignedWorker().getId().equals(currentUser.getId()))) {
            throw new RuntimeException("This complaint is not assigned to you");
        }

        return mapToResponse(complaint);
    }

    @Override
    public List<ComplaintResponse> getComplaintsByHostel(users warden) {
        if (warden.getHostel() == null) {
            throw new RuntimeException("Warden is not assigned to a hostel");
        }
        return complaintRepository.findByHostelId(warden.getHostel().getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<ComplaintResponse> getComplaintsByWorker(users worker) {
        return complaintRepository.findByAssignedWorkerId(worker.getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ComplaintResponse assignWorker(UUID complaintId, UUID workerId, users warden) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        // Warden can only manage complaints in their hostel
        if (warden.getHostel() == null
                || !complaint.getHostel().getId().equals(warden.getHostel().getId())) {
            throw new RuntimeException("You can only manage complaints in your hostel");
        }

        users worker = userRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));

        if (worker.getRole() != Role.WORKER) {
            throw new RuntimeException("Assigned user must have WORKER role");
        }

        Complaint.Status oldStatus = complaint.getStatus();
        complaint.setAssignedWorker(worker);
        complaint.setStatus(Complaint.Status.ASSIGNED);

        Complaint saved = complaintRepository.save(complaint);
        recordStatusChange(saved, oldStatus, Complaint.Status.ASSIGNED, warden);

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ComplaintResponse resolveComplaint(UUID complaintId, users worker) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if (complaint.getAssignedWorker() == null
                || !complaint.getAssignedWorker().getId().equals(worker.getId())) {
            throw new RuntimeException("This complaint is not assigned to you");
        }

        if (complaint.getStatus() == Complaint.Status.RESOLVED
                || complaint.getStatus() == Complaint.Status.REJECTED) {
            throw new RuntimeException("Complaint is already " + complaint.getStatus());
        }

        Complaint.Status oldStatus = complaint.getStatus();
        complaint.setStatus(Complaint.Status.RESOLVED);
        complaint.setResolvedAt(Instant.now());

        Complaint saved = complaintRepository.save(complaint);
        recordStatusChange(saved, oldStatus, Complaint.Status.RESOLVED, worker);

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ComplaintResponse rejectComplaint(UUID complaintId, users warden) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if (warden.getHostel() == null
                || !complaint.getHostel().getId().equals(warden.getHostel().getId())) {
            throw new RuntimeException("You can only manage complaints in your hostel");
        }

        Complaint.Status oldStatus = complaint.getStatus();
        complaint.setStatus(Complaint.Status.REJECTED);

        Complaint saved = complaintRepository.save(complaint);
        recordStatusChange(saved, oldStatus, Complaint.Status.REJECTED, warden);

        return mapToResponse(saved);
    }

    // ─── Helpers ───

    private void recordStatusChange(Complaint complaint, Complaint.Status oldStatus,
                                     Complaint.Status newStatus, users changedBy) {
        ComplaintStatusHistory history = ComplaintStatusHistory.builder()
                .complaint(complaint)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .changedBy(changedBy)
                .build();
        statusHistoryRepository.save(history);
    }

    private ComplaintResponse mapToResponse(Complaint c) {
        return ComplaintResponse.builder()
                .id(c.getId())
                .studentId(c.getStudent().getId())
                .studentName(c.getStudent().getName())
                .assignedWorkerId(c.getAssignedWorker() != null ? c.getAssignedWorker().getId() : null)
                .assignedWorkerName(c.getAssignedWorker() != null ? c.getAssignedWorker().getName() : null)
                .hostelId(c.getHostel().getId())
                .hostelName(c.getHostel().getName())
                .categoryId(c.getCategory().getId())
                .categoryName(c.getCategory().getName())
                .description(c.getDescription())
                .photoUrl(c.getPhotoUrl())
                .status(c.getStatus())
                .priority(c.getPriority())
                .escalationCount(c.getEscalationCount())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .resolvedAt(c.getResolvedAt())
                .build();
    }
}
