package com.HoCom.backend.repositories;

import com.HoCom.backend.models.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {

    Optional<Feedback> findByComplaintId(UUID complaintId);

    boolean existsByComplaintId(UUID complaintId);
}
