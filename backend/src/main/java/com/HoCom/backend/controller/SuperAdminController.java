package com.HoCom.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.HoCom.backend.dto.*;
import com.HoCom.backend.models.User;
import com.HoCom.backend.models.User.Role;
import com.HoCom.backend.repositories.UserRepository;
import com.HoCom.backend.service.AuthService;
import com.HoCom.backend.service.HostelService;
import com.HoCom.backend.service.UserService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * SUPER_ADMIN endpoints — company-level platform management.
 * All routes under /api/superadmin/** require SUPER_ADMIN role (enforced by SecurityConfig).
 *
 * Capabilities:
 *   - Manage all ADMIN accounts (create, read, update, delete, toggle)
 *   - Manage all hostels globally (create, list, assign to ADMIN)
 *   - View global platform stats
 */
@RestController
@RequestMapping("/api/superadmin")
@RequiredArgsConstructor
public class SuperAdminController {

    private final AuthService authService;
    private final UserService userService;
    private final HostelService hostelService;
    private final UserRepository userRepository;

    // ═══════════════════════════════════════════
    //  ADMIN MANAGEMENT
    // ═══════════════════════════════════════════

    /**
     * Create a new ADMIN account directly.
     * hostelId in the request is optional — SUPER_ADMIN can assign hostels separately.
     */
    @PostMapping("/admins")
    public ResponseEntity<AuthResponse> createAdmin(@Valid @RequestBody CreateUserRequest request,
                                                    @AuthenticationPrincipal User currentUser) {
        // Force role to ADMIN regardless of what was sent
        request.setRole(Role.ADMIN);
        AuthResponse response = authService.createUser(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /** List all ADMIN accounts (paginated) */
    @GetMapping("/admins")
    public ResponseEntity<PagedResponse<UserResponse>> getAllAdmins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<User> admins = userRepository.findByRole(
                Role.ADMIN, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        List<UserResponse> content = admins.getContent().stream()
                .map(this::mapUserToResponse)
                .toList();
        PagedResponse<UserResponse> result = PagedResponse.<UserResponse>builder()
                .content(content)
                .page(admins.getNumber())
                .size(admins.getSize())
                .totalElements(admins.getTotalElements())
                .totalPages(admins.getTotalPages())
                .last(admins.isLast())
                .build();
        return ResponseEntity.ok(result);
    }

    /** Get a single ADMIN by ID */
    @GetMapping("/admins/{adminId}")
    public ResponseEntity<UserResponse> getAdminById(@PathVariable UUID adminId) {
        return ResponseEntity.ok(userService.getUserById(adminId));
    }

    /** Update an ADMIN's name, email, or phone */
    @PutMapping("/admins/{adminId}")
    public ResponseEntity<UserResponse> updateAdmin(@PathVariable UUID adminId,
                                                    @Valid @RequestBody UpdateUserRequest request,
                                                    @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.updateUser(adminId, request, currentUser));
    }

    /** Delete an ADMIN account. Their hostels will have admin_id set to NULL (unassigned). */
    @DeleteMapping("/admins/{adminId}")
    public ResponseEntity<Map<String, String>> deleteAdmin(@PathVariable UUID adminId,
                                                           @AuthenticationPrincipal User currentUser) {
        userService.deleteUser(adminId, currentUser);
        return ResponseEntity.ok(Map.of("message", "Admin deleted. Their hostels are now unassigned."));
    }

    /** Enable or disable an ADMIN account */
    @PutMapping("/admins/{adminId}/toggle")
    public ResponseEntity<UserResponse> toggleAdmin(@PathVariable UUID adminId,
                                                    @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.toggleActive(adminId, currentUser));
    }

    // ═══════════════════════════════════════════
    //  HOSTEL MANAGEMENT (GLOBAL)
    // ═══════════════════════════════════════════

    /** List ALL hostels in the system (unscoped) */
    @GetMapping("/hostels")
    public ResponseEntity<List<HostelResponse>> getAllHostels() {
        return ResponseEntity.ok(hostelService.getAllHostels());
    }

    /**
     * Create a new hostel and optionally assign it to an ADMIN.
     * If adminId is not provided, hostel stays unassigned (admin_id = NULL).
     */
    @PostMapping("/hostels")
    public ResponseEntity<HostelResponse> createHostel(@Valid @RequestBody CreateHostelRequest request,
                                                       @AuthenticationPrincipal User currentUser) {
        // SUPER_ADMIN creating a hostel — no auto-assignment (they assign manually)
        HostelResponse hostel = hostelService.createHostel(request, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(hostel);
    }

    /**
     * Assign (or reassign) a hostel to a specific ADMIN.
     * Body: { "adminId": "uuid" }
     */
    @PutMapping("/hostels/{hostelId}/assign")
    public ResponseEntity<HostelResponse> assignHostelToAdmin(@PathVariable UUID hostelId,
                                                              @RequestBody Map<String, String> body) {
        UUID adminId = UUID.fromString(body.get("adminId"));
        return ResponseEntity.ok(hostelService.assignHostelToAdmin(hostelId, adminId));
    }

    /** Unassign a hostel from its current ADMIN (makes it platform-level) */
    @PutMapping("/hostels/{hostelId}/unassign")
    public ResponseEntity<HostelResponse> unassignHostel(@PathVariable UUID hostelId) {
        return ResponseEntity.ok(hostelService.assignHostelToAdmin(hostelId, null));
    }

    /** Delete any hostel globally */
    @DeleteMapping("/hostels/{hostelId}")
    public ResponseEntity<Map<String, String>> deleteHostel(@PathVariable UUID hostelId) {
        hostelService.deleteHostel(hostelId);
        return ResponseEntity.ok(Map.of("message", "Hostel deleted successfully"));
    }

    // ═══════════════════════════════════════════
    //  GLOBAL STATS
    // ═══════════════════════════════════════════

    /** Platform-wide counts — total admins, hostels, users by role */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getGlobalStats() {
        long totalAdmins   = userRepository.countByRole(Role.ADMIN);
        long totalWardens  = userRepository.countByRole(Role.WARDEN);
        long totalWorkers  = userRepository.countByRole(Role.WORKER);
        long totalStudents = userRepository.countByRole(Role.STUDENT);
        long totalHostels  = hostelService.getAllHostels().size();

        return ResponseEntity.ok(Map.of(
                "totalAdmins",   totalAdmins,
                "totalWardens",  totalWardens,
                "totalWorkers",  totalWorkers,
                "totalStudents", totalStudents,
                "totalHostels",  totalHostels,
                "totalUsers",    totalAdmins + totalWardens + totalWorkers + totalStudents
        ));
    }

    // ─── Helpers ───

    private UserResponse mapUserToResponse(User u) {
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
