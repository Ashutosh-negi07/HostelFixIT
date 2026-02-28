package com.HoCom.backend.service;

import com.HoCom.backend.dto.CreateHostelRequest;
import com.HoCom.backend.dto.HostelResponse;
import com.HoCom.backend.dto.UpdateHostelRequest;

import java.util.List;
import java.util.UUID;

public interface HostelService {

    HostelResponse createHostel(CreateHostelRequest request);

    HostelResponse updateHostel(UUID hostelId, UpdateHostelRequest request);

    HostelResponse getHostelById(UUID hostelId);

    List<HostelResponse> getAllHostels();

    void deleteHostel(UUID hostelId);
}
