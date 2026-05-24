package com.HoCom.backend.repositories;

import com.HoCom.backend.models.User;
import com.HoCom.backend.models.User.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Page<User> findByRole(Role role, Pageable pageable);

    Page<User> findByHostelIdAndRole(UUID hostelId, Role role, Pageable pageable);

    boolean existsByEmail(String email);

    // ─── Count methods for Dashboard ───

    long countByRole(Role role);

    long countByHostelIdAndRole(UUID hostelId, Role role);

    // ─── Scoped queries for ADMIN (filter by their hostel IDs) ───

    /** All non-ADMIN, non-SUPER_ADMIN users whose hostel is in the given list */
    @Query("SELECT u FROM User u WHERE u.hostel.id IN :hostelIds AND u.role NOT IN ('ADMIN', 'SUPER_ADMIN')")
    Page<User> findByHostelIdIn(List<UUID> hostelIds, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.hostel.id IN :hostelIds AND u.role = :role")
    Page<User> findByHostelIdInAndRole(List<UUID> hostelIds, Role role, Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u WHERE u.hostel.id IN :hostelIds AND u.role = :role")
    long countByHostelIdInAndRole(List<UUID> hostelIds, Role role);
}
