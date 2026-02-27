package com.HoCom.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.HoCom.backend.Config.JwtUtil;
import com.HoCom.backend.dto.AuthResponse;
import com.HoCom.backend.dto.CreateUserRequest;
import com.HoCom.backend.dto.LoginRequest;
import com.HoCom.backend.models.hostel;
import com.HoCom.backend.models.users;
import com.HoCom.backend.models.users.Role;
import com.HoCom.backend.repositories.HostelRepository;
import com.HoCom.backend.repositories.UserRepository;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final HostelRepository hostelRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public AuthResponse login(LoginRequest request) {

        users user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        if (!user.getIsActive()) {
            throw new RuntimeException("Account is deactivated");
        }

        String token = jwtUtil.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .message("Login successful")
                .build();
    }

    @Override
    public AuthResponse createUser(CreateUserRequest request, users createdBy) {

        Role creatorRole = createdBy.getRole();
        Role targetRole = request.getRole();

        // ADMIN can create: WARDEN, STUDENT, WORKER
        // WARDEN can create: STUDENT, WORKER
        // No one else can create users
        if (creatorRole == Role.ADMIN) {
            if (targetRole == Role.ADMIN) {
                throw new RuntimeException("Cannot create another ADMIN");
            }
        } else if (creatorRole == Role.WARDEN) {
            if (targetRole != Role.STUDENT && targetRole != Role.WORKER) {
                throw new RuntimeException("Warden can only create STUDENT or WORKER");
            }
        } else {
            throw new RuntimeException("You do not have permission to create users");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        users.usersBuilder userBuilder = users.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(targetRole)
                .isActive(true);

        if (request.getHostelId() != null) {
            hostel h = hostelRepository.findById(request.getHostelId())
                    .orElseThrow(() -> new RuntimeException("Hostel not found"));

            // Wardens can only create users in their own hostel
            if (creatorRole == Role.WARDEN) {
                if (createdBy.getHostel() == null
                        || !createdBy.getHostel().getId().equals(h.getId())) {
                    throw new RuntimeException("Warden can only create users in their own hostel");
                }
            }

            userBuilder.hostel(h);
        } else if (creatorRole == Role.WARDEN) {
            // Wardens must assign their own hostel if none provided
            if (createdBy.getHostel() == null) {
                throw new RuntimeException("Warden is not assigned to a hostel");
            }
            userBuilder.hostel(createdBy.getHostel());
        }

        users savedUser = userRepository.save(userBuilder.build());

        return AuthResponse.builder()
                .userId(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .message("User created successfully")
                .build();
    }
}
