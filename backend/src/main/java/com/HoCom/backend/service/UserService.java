package com.HoCom.backend.service;

import java.util.List;
import java.util.UUID;

import com.HoCom.backend.dto.PagedResponse;
import com.HoCom.backend.dto.UpdateUserRequest;
import com.HoCom.backend.dto.UserResponse;
import com.HoCom.backend.models.User;
import com.HoCom.backend.models.User.Role;

public interface UserService {

    UserResponse getUserById(UUID userId);

    /** SUPER_ADMIN only — returns all users in the system */
    PagedResponse<UserResponse> getAllUsers(int page, int size);

    /** SUPER_ADMIN only — returns all users of a given role */
    PagedResponse<UserResponse> getUsersByRole(Role role, int page, int size);

    /** ADMIN-scoped — returns non-admin users whose hostel is in the given hostel ID list */
    PagedResponse<UserResponse> getScopedUsers(List<UUID> hostelIds, int page, int size);

    /** ADMIN-scoped — returns users of a specific role whose hostel is in the given hostel ID list */
    PagedResponse<UserResponse> getScopedUsersByRole(List<UUID> hostelIds, Role role, int page, int size);

    PagedResponse<UserResponse> getUsersByHostelAndRole(UUID hostelId, Role role, int page, int size);

    UserResponse updateUser(UUID userId, UpdateUserRequest request, User currentUser);

    void deleteUser(UUID userId, User currentUser);

    UserResponse toggleActive(UUID userId, User admin);
}
