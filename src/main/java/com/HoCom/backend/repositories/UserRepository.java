package com.HoCom.backend.repositories;

import com.HoCom.backend.models.users;
import com.HoCom.backend.models.users.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<users, UUID> {

    Optional<users> findByPhone(long phone);

    Optional<users> findByEmail(String email);

    List<users> findByHostelIdAndRole(UUID hostelId, Role role);

    List<users> findByRole(Role role);

    boolean existsByPhone(long phone);

    boolean existsByEmail(String email);
}
