package com.HoCom.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.HoCom.backend.models.hostel;

import java.util.UUID;

@Repository
public interface HostelRepository extends JpaRepository<hostel, UUID> {
}
