package com.HoCom.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.HoCom.backend.models.Hostel;

import java.util.List;
import java.util.UUID;

@Repository
public interface HostelRepository extends JpaRepository<Hostel, UUID> {

    /** All hostels owned by a specific ADMIN */
    List<Hostel> findByAdminId(UUID adminId);

    /** IDs of hostels owned by a specific ADMIN — used for scoping queries */
    @Query("SELECT h.id FROM Hostel h WHERE h.admin.id = :adminId")
    List<UUID> findIdsByAdminId(UUID adminId);

    /** All hostel IDs in the system — used by SUPER_ADMIN (no filter) */
    @Query("SELECT h.id FROM Hostel h")
    List<UUID> findAllIds();
}
