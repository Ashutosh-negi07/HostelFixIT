package com.HoCom.backend.repositories;

import com.HoCom.backend.models.Complaint;
import com.HoCom.backend.models.Complaint.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {

    List<Complaint> findByStudentId(UUID studentId);

    List<Complaint> findByAssignedWorkerId(UUID workerId);

    List<Complaint> findByHostelId(UUID hostelId);

    List<Complaint> findByHostelIdAndStatus(UUID hostelId, Status status);

    List<Complaint> findByCategoryId(UUID categoryId);

    List<Complaint> findByStatus(Status status);
}
