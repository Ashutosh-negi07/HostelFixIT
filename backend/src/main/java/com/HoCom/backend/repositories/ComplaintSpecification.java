package com.HoCom.backend.repositories;

import com.HoCom.backend.models.Complaint;
import com.HoCom.backend.models.Complaint.Priority;
import com.HoCom.backend.models.Complaint.Status;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Dynamic query builder for Complaint filtering.
 * Replaces 20+ combinatorial repository methods with one flexible specification.
 */
public final class ComplaintSpecification {

    private ComplaintSpecification() {}

    public static Specification<Complaint> withFilters(UUID studentId,
                                                        UUID hostelId,
                                                        UUID assignedWorkerId,
                                                        Status status,
                                                        Priority priority,
                                                        UUID categoryId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (studentId != null) {
                predicates.add(cb.equal(root.get("student").get("id"), studentId));
            }
            if (hostelId != null) {
                predicates.add(cb.equal(root.get("hostel").get("id"), hostelId));
            }
            if (assignedWorkerId != null) {
                predicates.add(cb.equal(root.get("assignedWorker").get("id"), assignedWorkerId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
