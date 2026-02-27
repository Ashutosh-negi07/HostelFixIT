package com.HoCom.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.HoCom.backend.dto.*;
import com.HoCom.backend.models.Category;
import com.HoCom.backend.models.hostel;
import com.HoCom.backend.models.users;
import com.HoCom.backend.models.users.Role;
import com.HoCom.backend.repositories.CategoryRepository;
import com.HoCom.backend.repositories.HostelRepository;
import com.HoCom.backend.repositories.UserRepository;
import com.HoCom.backend.service.AuthService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AuthService authService;
    private final HostelRepository hostelRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    // ─── CREATE ───

    @PostMapping("/users")
    public ResponseEntity<AuthResponse> createUser(@Valid @RequestBody CreateUserRequest request,
                                                   @AuthenticationPrincipal users currentUser) {
        AuthResponse response = authService.createUser(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/hostels")
    public ResponseEntity<hostel> createHostel(@Valid @RequestBody CreateHostelRequest request,
                                               @AuthenticationPrincipal users currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only ADMIN can create hostels");
        }
        hostel newHostel = hostel.builder()
                .name(request.getName())
                .address(request.getAddress())
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(hostelRepository.save(newHostel));
    }

    // ─── READ ───

    @GetMapping("/hostels")
    public ResponseEntity<List<hostel>> getAllHostels() {
        return ResponseEntity.ok(hostelRepository.findAll());
    }

    @GetMapping("/hostels/{hostelId}/wardens")
    public ResponseEntity<List<users>> getWardensByHostel(@PathVariable UUID hostelId) {
        return ResponseEntity.ok(userRepository.findByHostelIdAndRole(hostelId, Role.WARDEN));
    }

    @GetMapping("/hostels/{hostelId}/students")
    public ResponseEntity<List<users>> getStudentsByHostel(@PathVariable UUID hostelId) {
        return ResponseEntity.ok(userRepository.findByHostelIdAndRole(hostelId, Role.STUDENT));
    }

    @GetMapping("/hostels/{hostelId}/workers")
    public ResponseEntity<List<users>> getWorkersByHostel(@PathVariable UUID hostelId) {
        return ResponseEntity.ok(userRepository.findByHostelIdAndRole(hostelId, Role.WORKER));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    // ─── UPDATE ───

    @PutMapping("/hostels/{hostelId}")
    public ResponseEntity<hostel> updateHostel(@PathVariable UUID hostelId,
                                               @RequestBody UpdateHostelRequest request,
                                               @AuthenticationPrincipal users currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only ADMIN can update hostels");
        }
        hostel h = hostelRepository.findById(hostelId)
                .orElseThrow(() -> new RuntimeException("Hostel not found"));
        if (request.getName() != null) h.setName(request.getName());
        if (request.getAddress() != null) h.setAddress(request.getAddress());
        return ResponseEntity.ok(hostelRepository.save(h));
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<Map<String, String>> updateUser(@PathVariable UUID userId,
                                                          @RequestBody UpdateUserRequest request,
                                                          @AuthenticationPrincipal users currentUser) {
        users target = userRepository.findById(userId)
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
        if (request.getPassword() != null) target.setPassword(passwordEncoder.encode(request.getPassword()));
        if (request.getRole() != null) target.setRole(request.getRole());
        if (request.getIsActive() != null) target.setIsActive(request.getIsActive());
        if (request.getHostelId() != null) {
            hostel h = hostelRepository.findById(request.getHostelId())
                    .orElseThrow(() -> new RuntimeException("Hostel not found"));
            target.setHostel(h);
        }

        userRepository.save(target);
        return ResponseEntity.ok(Map.of("message", "User updated successfully"));
    }

    // ─── DELETE ───

    @DeleteMapping("/hostels/{hostelId}")
    public ResponseEntity<Map<String, String>> deleteHostel(@PathVariable UUID hostelId,
                                                            @AuthenticationPrincipal users currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only ADMIN can delete hostels");
        }
        hostel h = hostelRepository.findById(hostelId)
                .orElseThrow(() -> new RuntimeException("Hostel not found"));
        hostelRepository.delete(h);
        return ResponseEntity.ok(Map.of("message", "Hostel deleted successfully"));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable UUID userId,
                                                          @AuthenticationPrincipal users currentUser) {
        users target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        validatePermission(currentUser, target);

        userRepository.delete(target);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    // ─── Helper ───

    private void validatePermission(users actor, users target) {
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
            // Wardens can only manage users in their own hostel
            if (actor.getHostel() == null || target.getHostel() == null
                    || !actor.getHostel().getId().equals(target.getHostel().getId())) {
                throw new RuntimeException("Warden can only manage users in their own hostel");
            }
        } else {
            throw new RuntimeException("No permission");
        }
    }
}
