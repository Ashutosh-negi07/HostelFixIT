package com.HoCom.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.HoCom.backend.dto.PagedResponse;
import com.HoCom.backend.dto.UpdateUserRequest;
import com.HoCom.backend.dto.UserResponse;
import com.HoCom.backend.models.Hostel;
import com.HoCom.backend.models.User;
import com.HoCom.backend.models.User.Role;
import com.HoCom.backend.repositories.HostelRepository;
import com.HoCom.backend.repositories.UserRepository;

import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final HostelRepository hostelRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserResponse getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return mapToResponse(user);
    }

    @Override
    public PagedResponse<UserResponse> getAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> users = userRepository.findAll(pageable);
        return toPagedResponse(users);
    }

    @Override
    public PagedResponse<UserResponse> getUsersByRole(Role role, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> users = userRepository.findByRole(role, pageable);
        return toPagedResponse(users);
    }

    @Override
    public PagedResponse<UserResponse> getUsersByHostelAndRole(UUID hostelId, Role role, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> users = userRepository.findByHostelIdAndRole(hostelId, role, pageable);
        return toPagedResponse(users);
    }

    @Override
    public UserResponse updateUser(UUID userId, UpdateUserRequest request, User currentUser) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        validatePermission(currentUser, target);

        if (request.getName() != null) target.setName(request.getName());
        if (request.getPhone() != null) target.setPhone(request.getPhone());
        if (request.getEmail() != null && !request.getEmail().equals(target.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email is already taken by another user");
            }
            target.setEmail(request.getEmail());
        }
        if (request.getPassword() != null) {
            // Self-update requires old password verification
            if (currentUser.getId().equals(target.getId())) {
                if (request.getOldPassword() == null || request.getOldPassword().isBlank()) {
                    throw new RuntimeException("Old password is required to change password");
                }
                if (!passwordEncoder.matches(request.getOldPassword(), target.getPassword())) {
                    throw new RuntimeException("Old password is incorrect");
                }
            }
            target.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getRole() != null) target.setRole(request.getRole());
        if (request.getIsActive() != null) target.setIsActive(request.getIsActive());
        if (request.getHostelId() != null) {
            Hostel h = hostelRepository.findById(request.getHostelId())
                    .orElseThrow(() -> new RuntimeException("Hostel not found"));
            target.setHostel(h);
        }

        return mapToResponse(userRepository.save(target));
    }

    @Override
    public void deleteUser(UUID userId, User currentUser) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        validatePermission(currentUser, target);
        userRepository.delete(target);
    }

    @Override
    public UserResponse toggleActive(UUID userId, User admin) {
        if (admin.getRole() != Role.ADMIN && admin.getRole() != Role.SUPER_ADMIN) {
            throw new RuntimeException("Only ADMIN or SUPER_ADMIN can toggle user active status");
        }

        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ADMIN cannot toggle another ADMIN or SUPER_ADMIN
        if (admin.getRole() == Role.ADMIN &&
                (target.getRole() == Role.ADMIN || target.getRole() == Role.SUPER_ADMIN)) {
            throw new RuntimeException("ADMIN cannot toggle active status of another ADMIN or SUPER_ADMIN");
        }
        // SUPER_ADMIN cannot deactivate themselves
        if (admin.getRole() == Role.SUPER_ADMIN && target.getRole() == Role.SUPER_ADMIN) {
            throw new RuntimeException("Cannot toggle SUPER_ADMIN account");
        }

        target.setIsActive(!target.getIsActive());
        return mapToResponse(userRepository.save(target));
    }

    // ─── Helpers ───

    private void validatePermission(User actor, User target) {
        // Allow self-update
        if (actor.getId().equals(target.getId())) {
            return;
        }

        Role actorRole = actor.getRole();
        Role targetRole = target.getRole();

        if (actorRole == Role.SUPER_ADMIN) {
            // SUPER_ADMIN can modify anyone except another SUPER_ADMIN
            if (targetRole == Role.SUPER_ADMIN) {
                throw new RuntimeException("Cannot modify SUPER_ADMIN account");
            }
            return;
        }

        if (actorRole == Role.ADMIN) {
            if (targetRole == Role.ADMIN || targetRole == Role.SUPER_ADMIN) {
                throw new RuntimeException("Cannot modify ADMIN or SUPER_ADMIN");
            }
        } else if (actorRole == Role.WARDEN) {
            if (targetRole != Role.STUDENT && targetRole != Role.WORKER) {
                throw new RuntimeException("Warden can only modify STUDENT or WORKER");
            }
            if (actor.getHostel() == null || target.getHostel() == null
                    || !actor.getHostel().getId().equals(target.getHostel().getId())) {
                throw new RuntimeException("Warden can only manage users in their own hostel");
            }
        } else {
            throw new RuntimeException("No permission");
        }
    }

    private UserResponse mapToResponse(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .phone(u.getPhone())
                .email(u.getEmail())
                .role(u.getRole())
                .hostelId(u.getHostel() != null ? u.getHostel().getId() : null)
                .hostelName(u.getHostel() != null ? u.getHostel().getName() : null)
                .isActive(u.getIsActive())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }

    private PagedResponse<UserResponse> toPagedResponse(Page<User> pageResult) {
        return PagedResponse.<UserResponse>builder()
                .content(pageResult.getContent().stream().map(this::mapToResponse).collect(Collectors.toList()))
                .page(pageResult.getNumber())
                .size(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .last(pageResult.isLast())
                .build();
    }
}
