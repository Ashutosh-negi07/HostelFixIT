package com.HoCom.Fixit.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.HoCom.Fixit.dto.UpdateUserRequest;
import com.HoCom.Fixit.dto.UserResponse;
import com.HoCom.Fixit.models.Hostel;
import com.HoCom.Fixit.models.User;
import com.HoCom.Fixit.models.User.Role;
import com.HoCom.Fixit.repositories.HostelRepository;
import com.HoCom.Fixit.repositories.UserRepository;

import java.util.List;
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
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserResponse> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserResponse> getUsersByHostelAndRole(UUID hostelId, Role role) {
        return userRepository.findByHostelIdAndRole(hostelId, role).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
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

    // ─── Helpers ───

    private void validatePermission(User actor, User target) {
        // Allow self-update (e.g., student updating own profile)
        if (actor.getId().equals(target.getId())) {
            return;
        }

        Role actorRole = actor.getRole();
        Role targetRole = target.getRole();

        if (actorRole == Role.ADMIN) {
            if (targetRole == Role.ADMIN) {
                throw new RuntimeException("Cannot modify another ADMIN");
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
}
