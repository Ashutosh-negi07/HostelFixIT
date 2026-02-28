package com.HoCom.backend.service;

import com.HoCom.backend.dto.CreateHostelRequest;
import com.HoCom.backend.dto.HostelResponse;
import com.HoCom.backend.dto.UpdateHostelRequest;
import com.HoCom.backend.models.Hostel;
import com.HoCom.backend.repositories.HostelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HostelServiceImpl implements HostelService {

    private final HostelRepository hostelRepository;

    @Override
    public HostelResponse createHostel(CreateHostelRequest request) {
        Hostel h = Hostel.builder()
                .name(request.getName())
                .address(request.getAddress())
                .build();
        return mapToResponse(hostelRepository.save(h));
    }

    @Override
    public HostelResponse updateHostel(UUID hostelId, UpdateHostelRequest request) {
        Hostel h = hostelRepository.findById(hostelId)
                .orElseThrow(() -> new RuntimeException("Hostel not found with id: " + hostelId));

        if (request.getName() != null) h.setName(request.getName());
        if (request.getAddress() != null) h.setAddress(request.getAddress());

        return mapToResponse(hostelRepository.save(h));
    }

    @Override
    public HostelResponse getHostelById(UUID hostelId) {
        Hostel h = hostelRepository.findById(hostelId)
                .orElseThrow(() -> new RuntimeException("Hostel not found with id: " + hostelId));
        return mapToResponse(h);
    }

    @Override
    public List<HostelResponse> getAllHostels() {
        return hostelRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteHostel(UUID hostelId) {
        Hostel h = hostelRepository.findById(hostelId)
                .orElseThrow(() -> new RuntimeException("Hostel not found with id: " + hostelId));
        hostelRepository.delete(h);
    }

    private HostelResponse mapToResponse(Hostel h) {
        return HostelResponse.builder()
                .id(h.getId())
                .name(h.getName())
                .address(h.getAddress())
                .createdAt(h.getCreatedAt())
                .build();
    }
}
