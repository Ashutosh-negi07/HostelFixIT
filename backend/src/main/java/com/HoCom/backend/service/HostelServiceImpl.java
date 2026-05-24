package com.HoCom.backend.service;

import com.HoCom.backend.dto.CreateHostelRequest;
import com.HoCom.backend.dto.HostelResponse;
import com.HoCom.backend.dto.UpdateHostelRequest;
import com.HoCom.backend.models.Hostel;
import com.HoCom.backend.models.User;
import com.HoCom.backend.models.User.Role;
import com.HoCom.backend.repositories.HostelRepository;
import com.HoCom.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HostelServiceImpl implements HostelService {

    private final HostelRepository hostelRepository;
    private final UserRepository userRepository;

    @Override
    public HostelResponse createHostel(CreateHostelRequest request, User createdBy) {
        Hostel h = Hostel.builder()
                .name(request.getName())
                .address(request.getAddress())
                .build();

        // If the creator is an ADMIN, auto-assign this hostel to them
        if (createdBy != null && createdBy.getRole() == Role.ADMIN) {
            h.setAdmin(createdBy);
        }

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
    public List<HostelResponse> getScopedHostels(User caller) {
        if (caller.getRole() == Role.SUPER_ADMIN) {
            return getAllHostels();
        }
        // ADMIN sees only their own hostels
        return hostelRepository.findByAdminId(caller.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<UUID> getScopedHostelIds(User caller) {
        if (caller.getRole() == Role.SUPER_ADMIN) {
            return hostelRepository.findAllIds();
        }
        return hostelRepository.findIdsByAdminId(caller.getId());
    }

    @Override
    public void deleteHostel(UUID hostelId) {
        Hostel h = hostelRepository.findById(hostelId)
                .orElseThrow(() -> new RuntimeException("Hostel not found with id: " + hostelId));
        hostelRepository.delete(h);
    }

    @Override
    public HostelResponse assignHostelToAdmin(UUID hostelId, UUID adminId) {
        Hostel h = hostelRepository.findById(hostelId)
                .orElseThrow(() -> new RuntimeException("Hostel not found"));

        if (adminId == null) {
            // Unassign — hostel becomes platform-level (SUPER_ADMIN only)
            h.setAdmin(null);
        } else {
            User admin = userRepository.findById(adminId)
                    .orElseThrow(() -> new RuntimeException("Admin not found"));
            if (admin.getRole() != Role.ADMIN) {
                throw new RuntimeException("Target user is not an ADMIN");
            }
            h.setAdmin(admin);
        }

        return mapToResponse(hostelRepository.save(h));
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
