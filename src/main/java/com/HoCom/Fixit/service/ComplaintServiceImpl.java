package com.HoCom.Fixit.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.HoCom.Fixit.dto.ComplaintResponse;
import com.HoCom.Fixit.dto.CreateComplaintRequest;
import com.HoCom.Fixit.dto.UpdateComplaintRequest;
import com.HoCom.Fixit.models.*;
import com.HoCom.Fixit.models.User.Role;
import com.HoCom.Fixit.repositories.CategoryRepository;
import com.HoCom.Fixit.repositories.ComplaintRepository;
import com.HoCom.Fixit.repositories.ComplaintStatusHistoryRepository;
import com.HoCom.Fixit.repositories.UserRepository;

import java.time.Instant;
import java.util.Comparator;
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

        complaintRepository.delete(complaint);

        return mapToResponse(complaint);
    }

    @Override
    public List<ComplaintResponse> getMyComplaints(User student, Complaint.Status status,
                                                    Complaint.Priority priority, UUID categoryId,
                                                    String sortBy, String order) {

        UUID studentId = student.getId();
        List<Complaint> complaints;

        // Filter by combinations of status, priority, categoryId
        if (status != null && priority != null && categoryId != null) {
            complaints = complaintRepository.findByStudentIdAndStatusAndPriorityAndCategoryId(studentId, status, priority, categoryId);
        } else if (status != null && priority != null) {
            complaints = complaintRepository.findByStudentIdAndStatusAndPriority(studentId, status, priority);
        } else if (status != null && categoryId != null) {
            complaints = complaintRepository.findByStudentIdAndStatusAndCategoryId(studentId, status, categoryId);
        } else if (priority != null && categoryId != null) {
            complaints = complaintRepository.findByStudentIdAndPriorityAndCategoryId(studentId, priority, categoryId);
        } else if (status != null) {
            complaints = complaintRepository.findByStudentIdAndStatus(studentId, status);
        } else if (priority != null) {
            complaints = complaintRepository.findByStudentIdAndPriority(studentId, priority);
        } else if (categoryId != null) {
            complaints = complaintRepository.findByStudentIdAndCategoryId(studentId, categoryId);
        } else {
            complaints = complaintRepository.findByStudentId(studentId);
        }

        // Sort
        Comparator<Complaint> comparator = getComparator(sortBy);
        if ("desc".equalsIgnoreCase(order)) {
            comparator = comparator.reversed();
        }
        complaints.sort(comparator);

        return complaints.stream().map(this::mapToResponse).collect(Collectors.toList());
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

        return mapToResponse(complaint);
    }

    @Override
    public List<ComplaintResponse> getComplaintsByHostel(User warden) {
        if (warden.getHostel() == null) {
            throw new RuntimeException("Warden is not assigned to a hostel");
        }
        return complaintRepository.findByHostelId(warden.getHostel().getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<ComplaintResponse> getComplaintsByHostelFiltered(User warden, Complaint.Status status,
                                                                  Complaint.Priority priority, UUID categoryId,
                                                                  String sortBy, String order) {
        if (warden.getHostel() == null) {
            throw new RuntimeException("Warden is not assigned to a hostel");
        }
        UUID hostelId = warden.getHostel().getId();
        List<Complaint> complaints;

        if (status != null && priority != null) {
            complaints = complaintRepository.findByHostelIdAndStatusAndPriority(hostelId, status, priority);
        } else if (status != null) {
            complaints = complaintRepository.findByHostelIdAndStatus(hostelId, status);
        } else if (priority != null) {
            complaints = complaintRepository.findByHostelIdAndPriority(hostelId, priority);
        } else {
            complaints = complaintRepository.findByHostelId(hostelId);
        }

        Comparator<Complaint> comparator = getComparator(sortBy);
        if ("desc".equalsIgnoreCase(order)) {
            comparator = comparator.reversed();
        }
        complaints.sort(comparator);

        return complaints.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<ComplaintResponse> getComplaintsByWorker(User worker) {
        return complaintRepository.findByAssignedWorkerId(worker.getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
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
    public ComplaintResponse startProgress(UUID complaintId, users worker) {
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

        return mapToResponse(saved);
    }

    @Override
    public List<ComplaintResponse> getWorkerComplaints(users worker, Complaint.Status status,
                                                       Complaint.Priority priority,
                                                       String sortBy, String order) {
        UUID workerId = worker.getId();
        List<Complaint> complaints;

        if (status != null && priority != null) {
            complaints = complaintRepository.findByAssignedWorkerIdAndStatusAndPriority(workerId, status, priority);
        } else if (status != null) {
            complaints = complaintRepository.findByAssignedWorkerIdAndStatus(workerId, status);
        } else if (priority != null) {
            complaints = complaintRepository.findByAssignedWorkerIdAndPriority(workerId, priority);
        } else {
            complaints = complaintRepository.findByAssignedWorkerId(workerId);
        }

        Comparator<Complaint> comparator = getComparator(sortBy);
        if ("desc".equalsIgnoreCase(order)) {
            comparator = comparator.reversed();
        }
        complaints.sort(comparator);

        return complaints.stream().map(this::mapToResponse).collect(Collectors.toList());
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

    @Override
    public List<ComplaintResponse> getAllComplaints(Complaint.Status status, Complaint.Priority priority,
                                                    UUID hostelId, String sortBy, String order) {
        List<Complaint> complaints;

        if (hostelId != null && status != null && priority != null) {
            complaints = complaintRepository.findByHostelIdAndStatusAndPriority(hostelId, status, priority);
        } else if (hostelId != null && status != null) {
            complaints = complaintRepository.findByHostelIdAndStatus(hostelId, status);
        } else if (hostelId != null && priority != null) {
            complaints = complaintRepository.findByHostelIdAndPriority(hostelId, priority);
        } else if (hostelId != null) {
            complaints = complaintRepository.findByHostelId(hostelId);
        } else if (status != null && priority != null) {
            complaints = complaintRepository.findByStatusAndPriority(status, priority);
        } else if (status != null) {
            complaints = complaintRepository.findByStatus(status);
        } else if (priority != null) {
            complaints = complaintRepository.findByPriority(priority);
        } else {
            complaints = complaintRepository.findAll();
        }

        Comparator<Complaint> comparator = getComparator(sortBy);
        if ("desc".equalsIgnoreCase(order)) {
            comparator = comparator.reversed();
        }
        complaints.sort(comparator);

        return complaints.stream().map(this::mapToResponse).collect(Collectors.toList());
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
                // .escalationCount(c.getEscalationCount()) // Escalation feature — reserved for future use
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .resolvedAt(c.getResolvedAt())
                .build();
    }

    private Comparator<Complaint> getComparator(String sortBy) {
        if (sortBy == null) sortBy = "createdAt";
        return switch (sortBy.toLowerCase()) {
            case "updatedat" -> Comparator.comparing(Complaint::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder()));
            case "priority" -> Comparator.comparing(Complaint::getPriority);
            case "status" -> Comparator.comparing(Complaint::getStatus);
            case "resolvedat" -> Comparator.comparing(Complaint::getResolvedAt, Comparator.nullsLast(Comparator.naturalOrder()));
            default -> Comparator.comparing(Complaint::getCreatedAt);
        };
    }
}
