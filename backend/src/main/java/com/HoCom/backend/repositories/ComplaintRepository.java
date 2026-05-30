package com.HoCom.backend.repositories;

import com.HoCom.backend.models.Complaint;
import com.HoCom.backend.models.Complaint.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
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

    // ─── Aggregated groupings for Admin dashboard charts ───

    /** Returns [categoryName, count] pairs for all complaints */
    @Query("SELECT c.category.name, COUNT(c) FROM Complaint c GROUP BY c.category.name ORDER BY COUNT(c) DESC")
    List<Object[]> countGroupByCategory();

    /** Returns [hostelName, count] pairs for all complaints */
    @Query("SELECT c.hostel.name, COUNT(c) FROM Complaint c GROUP BY c.hostel.name ORDER BY COUNT(c) DESC")
    List<Object[]> countGroupByHostel();
}

