package com.HoCom.backend.repositories;

import com.HoCom.backend.models.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {

    Optional<Feedback> findByComplaintId(UUID complaintId);

    boolean existsByComplaintId(UUID complaintId);

    // ─── Stats for Dashboard ───

    @Query("SELECT AVG(f.rating) FROM Feedback f")
    Double findAverageRating();

    // ─── Hostel-scoped stats for Warden Dashboard ───

    long countByComplaintHostelId(UUID hostelId);

    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.complaint.hostel.id = :hostelId")
    Double findAverageRatingByHostelId(@Param("hostelId") UUID hostelId);
}
