package com.HoCom.backend.service;

import com.HoCom.backend.dto.CreateHostelRequest;
import com.HoCom.backend.dto.HostelResponse;
import com.HoCom.backend.dto.UpdateHostelRequest;
import com.HoCom.backend.models.User;

import java.util.List;
import java.util.UUID;

public interface HostelService {

    HostelResponse createHostel(CreateHostelRequest request, User createdBy);

    HostelResponse updateHostel(UUID hostelId, UpdateHostelRequest request);

    HostelResponse getHostelById(UUID hostelId);

    List<HostelResponse> getAllHostels();

    /** Returns hostels scoped to the caller (ADMIN → their own; SUPER_ADMIN → all) */
    List<HostelResponse> getScopedHostels(User caller);

    /** Returns hostel IDs scoped to caller — used to filter all other queries */
    List<UUID> getScopedHostelIds(User caller);

    void deleteHostel(UUID hostelId);

    /** SUPER_ADMIN: Assign or reassign a hostel to an ADMIN */
    HostelResponse assignHostelToAdmin(UUID hostelId, UUID adminId);
}
