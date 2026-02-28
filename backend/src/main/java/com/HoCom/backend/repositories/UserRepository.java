package com.HoCom.backend.repositories;

import com.HoCom.backend.models.User;
import com.HoCom.backend.models.User.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}
