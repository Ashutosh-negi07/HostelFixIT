package com.HoCom.backend.repositories;

import com.HoCom.backend.models.Complaint;
import com.HoCom.backend.models.Complaint.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, UUID>, JpaSpecificationExecutor<Complaint> {

    // ─── Count methods for Dashboard ───

    long countByStatus(Status status);

    long countByHostelId(UUID hostelId);

    long countByHostelIdAndStatus(UUID hostelId, Status status);

    // ─── Count methods for Student ───

    long countByStudentId(UUID studentId);

    long countByStudentIdAndStatus(UUID studentId, Status status);

    // ─── Count methods for Worker ───

    long countByAssignedWorkerId(UUID workerId);

    long countByAssignedWorkerIdAndStatus(UUID workerId, Status status);
}
