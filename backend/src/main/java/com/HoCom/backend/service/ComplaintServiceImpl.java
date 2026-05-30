package com.HoCom.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.HoCom.backend.dto.ComplaintCountResponse;
import com.HoCom.backend.dto.ComplaintResponse;
import com.HoCom.backend.dto.CreateComplaintRequest;
import com.HoCom.backend.dto.PagedResponse;
import com.HoCom.backend.dto.UpdateComplaintRequest;
import com.HoCom.backend.models.*;
import com.HoCom.backend.models.User.Role;
import com.HoCom.backend.repositories.CategoryRepository;
import com.HoCom.backend.repositories.ComplaintRepository;
import com.HoCom.backend.repositories.ComplaintSpecification;
import com.HoCom.backend.repositories.ComplaintStatusHistoryRepository;
import com.HoCom.backend.repositories.UserRepository;

import java.time.Instant;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ComplaintStatusHistoryRepository statusHistoryRepository;
    private final NotificationService notificationService;
    private final CloudinaryService cloudinaryService;

    @Override
    public ComplaintResponse createComplaint(CreateComplaintRequest request, User student) {
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

        // Notify wardens of this hostel about the new complaint
        userRepository.findByHostelIdAndRole(saved.getHostel().getId(), Role.WARDEN,
                PageRequest.of(0, 100)).getContent()
                .forEach(warden -> notificationService.notify(warden,
                        "New Complaint Filed",
                        "A new " + saved.getPriority() + " priority complaint has been filed by " + student.getName(),
                        saved.getId(), "COMPLAINT"));

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ComplaintResponse updateComplaint(UUID complaintId, UpdateComplaintRequest request, String photoUrl, User student) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if (!complaint.getStudent().getId().equals(student.getId())) {
            throw new RuntimeException("You can only update your own complaints");
        }

        if (complaint.getStatus() != Complaint.Status.PENDING) {
            throw new RuntimeException("Only PENDING complaints can be updated");
        }

        if (request.getDescription() != null) {
            complaint.setDescription(request.getDescription());
        }
        if (request.getPriority() != null) {
            complaint.setPriority(request.getPriority());
        }
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            complaint.setCategory(category);
        }
        if (photoUrl != null) {
            // Delete the old photo from Cloudinary before replacing it
            if (complaint.getPhotoUrl() != null) {
                cloudinaryService.delete(complaint.getPhotoUrl());
            }
            complaint.setPhotoUrl(photoUrl);
        }

        Complaint saved = complaintRepository.save(complaint);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ComplaintResponse cancelComplaint(UUID complaintId, User student) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if (!complaint.getStudent().getId().equals(student.getId())) {
            throw new RuntimeException("You can only cancel your own complaints");
        }

        if (complaint.getStatus() != Complaint.Status.PENDING) {
            throw new RuntimeException("Only PENDING complaints can be cancelled");
        }

        // Delete the photo from Cloudinary before removing the complaint
        if (complaint.getPhotoUrl() != null) {
            cloudinaryService.delete(complaint.getPhotoUrl());
        }

        complaintRepository.delete(complaint);

        return mapToResponse(complaint);
    }

    @Override
    public PagedResponse<ComplaintResponse> getMyComplaints(User student, Complaint.Status status,
                                                    Complaint.Priority priority, UUID categoryId,
                                                    String sortBy, String order, int page, int size) {

        Pageable pageable = buildPageable(page, size, sortBy, order);
        Page<Complaint> complaints = complaintRepository.findAll(
                ComplaintSpecification.withFilters(student.getId(), null, null, status, priority, categoryId),
                pageable);

        return toPagedResponse(complaints);
    }

    @Override
    public ComplaintResponse getComplaintById(UUID complaintId, User currentUser) {
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
        if (currentUser.getRole() == Role.WARDEN) {
            if (currentUser.getHostel() == null
                    || !complaint.getHostel().getId().equals(currentUser.getHostel().getId())) {
                throw new RuntimeException("You can only manage complaints in your hostel");
            }
        }

        return mapToResponse(complaint);
    }

    @Override
    public PagedResponse<ComplaintResponse> getComplaintsByHostelFiltered(User warden, Complaint.Status status,
                                                                  Complaint.Priority priority, UUID categoryId,
                                                                  String sortBy, String order, int page, int size) {
        if (warden.getHostel() == null) {
            throw new RuntimeException("Warden is not assigned to a hostel");
        }
        UUID hostelId = warden.getHostel().getId();

        Pageable pageable = buildPageable(page, size, sortBy, order);
        Page<Complaint> complaints = complaintRepository.findAll(
                ComplaintSpecification.withFilters(null, hostelId, null, status, priority, categoryId),
                pageable);

        return toPagedResponse(complaints);
    }

    @Override
    public PagedResponse<ComplaintResponse> getWorkerComplaints(User worker, Complaint.Status status,
                                                       Complaint.Priority priority,
                                                       String sortBy, String order, int page, int size) {
        Pageable pageable = buildPageable(page, size, sortBy, order);
        Page<Complaint> complaints = complaintRepository.findAll(
                ComplaintSpecification.withFilters(null, null, worker.getId(), status, priority, null),
                pageable);

        return toPagedResponse(complaints);
    }

    @Override
    @Transactional
    public ComplaintResponse assignWorker(UUID complaintId, UUID workerId, User warden) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        // Warden can only manage complaints in their hostel
        if (warden.getHostel() == null
                || !complaint.getHostel().getId().equals(warden.getHostel().getId())) {
            throw new RuntimeException("You can only manage complaints in your hostel");
        }

        User worker = userRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));

        if (worker.getRole() != Role.WORKER) {
            throw new RuntimeException("Assigned user must have WORKER role");
        }

        Complaint.Status oldStatus = complaint.getStatus();
        complaint.setAssignedWorker(worker);
        complaint.setStatus(Complaint.Status.ASSIGNED);

        Complaint saved = complaintRepository.save(complaint);
        recordStatusChange(saved, oldStatus, Complaint.Status.ASSIGNED, warden);

        // Notify student that their complaint was assigned
        notificationService.notify(saved.getStudent(),
                "Complaint Assigned",
                "Your complaint has been assigned to " + worker.getName(),
                saved.getId(), "COMPLAINT");

        // Notify worker about the new assignment
        notificationService.notify(worker,
                "New Assignment",
                "You have been assigned a new complaint: " + saved.getDescription().substring(0, Math.min(saved.getDescription().length(), 80)),
                saved.getId(), "COMPLAINT");

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ComplaintResponse resolveComplaint(UUID complaintId, User worker) {
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

        // Notify student that their complaint was resolved
        notificationService.notify(saved.getStudent(),
                "Complaint Resolved",
                "Your complaint has been resolved. Please provide feedback!",
                saved.getId(), "COMPLAINT");

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ComplaintResponse startProgress(UUID complaintId, User worker) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if (complaint.getAssignedWorker() == null
                || !complaint.getAssignedWorker().getId().equals(worker.getId())) {
            throw new RuntimeException("This complaint is not assigned to you");
        }

        if (complaint.getStatus() != Complaint.Status.ASSIGNED) {
            throw new RuntimeException("Only ASSIGNED complaints can be moved to IN_PROGRESS");
        }

        Complaint.Status oldStatus = complaint.getStatus();
        complaint.setStatus(Complaint.Status.IN_PROGRESS);

        Complaint saved = complaintRepository.save(complaint);
        recordStatusChange(saved, oldStatus, Complaint.Status.IN_PROGRESS, worker);

        // Notify student that work has started
        notificationService.notify(saved.getStudent(),
                "Work Started",
                "Work has started on your complaint",
                saved.getId(), "COMPLAINT");

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ComplaintResponse rejectComplaint(UUID complaintId, User warden) {
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

        // Notify student that their complaint was rejected
        notificationService.notify(saved.getStudent(),
                "Complaint Rejected",
                "Your complaint has been rejected by the warden",
                saved.getId(), "COMPLAINT");

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ComplaintResponse reassignWorker(UUID complaintId, UUID newWorkerId, User warden) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        // Warden can only manage complaints in their hostel
        if (warden.getHostel() == null
                || !complaint.getHostel().getId().equals(warden.getHostel().getId())) {
            throw new RuntimeException("You can only manage complaints in your hostel");
        }

        // Can only reassign if complaint has been assigned before
        if (complaint.getStatus() != Complaint.Status.ASSIGNED
                && complaint.getStatus() != Complaint.Status.IN_PROGRESS) {
            throw new RuntimeException("Can only reassign complaints that are ASSIGNED or IN_PROGRESS");
        }

        User newWorker = userRepository.findById(newWorkerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));

        if (newWorker.getRole() != Role.WORKER) {
            throw new RuntimeException("Assigned user must have WORKER role");
        }

        User oldWorker = complaint.getAssignedWorker();
        complaint.setAssignedWorker(newWorker);
        complaint.setStatus(Complaint.Status.ASSIGNED);

        Complaint saved = complaintRepository.save(complaint);

        // Notify old worker about removal
        if (oldWorker != null) {
            notificationService.notify(oldWorker,
                    "Assignment Removed",
                    "You have been removed from a complaint assignment",
                    saved.getId(), "COMPLAINT");
        }

        // Notify student about reassignment
        notificationService.notify(saved.getStudent(),
                "Complaint Reassigned",
                "Your complaint has been reassigned to " + newWorker.getName(),
                saved.getId(), "COMPLAINT");

        // Notify new worker about the assignment
        notificationService.notify(newWorker,
                "New Assignment",
                "You have been assigned a complaint: " + saved.getDescription().substring(0, Math.min(saved.getDescription().length(), 80)),
                saved.getId(), "COMPLAINT");

        return mapToResponse(saved);
    }

    @Override
    public PagedResponse<ComplaintResponse> getAllComplaints(Complaint.Status status, Complaint.Priority priority,
                                                    UUID hostelId, String sortBy, String order, int page, int size) {
        Pageable pageable = buildPageable(page, size, sortBy, order);
        Page<Complaint> complaints = complaintRepository.findAll(
                ComplaintSpecification.withFilters(null, hostelId, null, status, priority, null),
                pageable);

        return toPagedResponse(complaints);
    }

    @Override
    public ComplaintCountResponse getStudentComplaintCounts(User student) {
        UUID studentId = student.getId();
        return ComplaintCountResponse.builder()
                .pending(complaintRepository.countByStudentIdAndStatus(studentId, Complaint.Status.PENDING))
                .assigned(complaintRepository.countByStudentIdAndStatus(studentId, Complaint.Status.ASSIGNED))
                .inProgress(complaintRepository.countByStudentIdAndStatus(studentId, Complaint.Status.IN_PROGRESS))
                .resolved(complaintRepository.countByStudentIdAndStatus(studentId, Complaint.Status.RESOLVED))
                .rejected(complaintRepository.countByStudentIdAndStatus(studentId, Complaint.Status.REJECTED))
                .total(complaintRepository.countByStudentId(studentId))
                .build();
    }

    @Override
    public ComplaintCountResponse getWorkerComplaintCounts(User worker) {
        UUID workerId = worker.getId();
        return ComplaintCountResponse.builder()
                .pending(0) // Workers don't have pending complaints
                .assigned(complaintRepository.countByAssignedWorkerIdAndStatus(workerId, Complaint.Status.ASSIGNED))
                .inProgress(complaintRepository.countByAssignedWorkerIdAndStatus(workerId, Complaint.Status.IN_PROGRESS))
                .resolved(complaintRepository.countByAssignedWorkerIdAndStatus(workerId, Complaint.Status.RESOLVED))
                .rejected(0) // Workers' complaints aren't rejected to them
                .total(complaintRepository.countByAssignedWorkerId(workerId))
                .build();
    }

    @Override
    public ComplaintCountResponse getWardenComplaintCounts(User warden) {
        if (warden.getHostel() == null) {
            return ComplaintCountResponse.builder()
                    .pending(0).assigned(0).inProgress(0).resolved(0).rejected(0).total(0)
                    .build();
        }
        UUID hostelId = warden.getHostel().getId();
        return ComplaintCountResponse.builder()
                .pending(complaintRepository.countByHostelIdAndStatus(hostelId, Complaint.Status.PENDING))
                .assigned(complaintRepository.countByHostelIdAndStatus(hostelId, Complaint.Status.ASSIGNED))
                .inProgress(complaintRepository.countByHostelIdAndStatus(hostelId, Complaint.Status.IN_PROGRESS))
                .resolved(complaintRepository.countByHostelIdAndStatus(hostelId, Complaint.Status.RESOLVED))
                .rejected(complaintRepository.countByHostelIdAndStatus(hostelId, Complaint.Status.REJECTED))
                .total(complaintRepository.countByHostelId(hostelId))
                .build();
    }


    // ─── Helpers ───

    private Pageable buildPageable(int page, int size, String sortBy, String order) {
        if (sortBy == null || sortBy.isBlank()) sortBy = "createdAt";
        Sort.Direction dir = "asc".equalsIgnoreCase(order) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(page, size, Sort.by(dir, sortBy));
    }

    private PagedResponse<ComplaintResponse> toPagedResponse(Page<Complaint> pageResult) {
        return PagedResponse.<ComplaintResponse>builder()
                .content(pageResult.getContent().stream().map(this::mapToResponse).collect(Collectors.toList()))
                .page(pageResult.getNumber())
                .size(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .last(pageResult.isLast())
                .build();
    }

    private void recordStatusChange(Complaint complaint, Complaint.Status oldStatus,
                                     Complaint.Status newStatus, User changedBy) {
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
                // .escalationCount(c.getEscalationCount()) // Escalation feature — reserved for future use
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .resolvedAt(c.getResolvedAt())
                .build();
    }

}
