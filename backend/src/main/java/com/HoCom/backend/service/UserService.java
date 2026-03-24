package com.HoCom.backend.service;

import java.util.UUID;

import com.HoCom.backend.dto.PagedResponse;
import com.HoCom.backend.dto.UpdateUserRequest;
import com.HoCom.backend.dto.UserResponse;
import com.HoCom.backend.models.User;
import com.HoCom.backend.models.User.Role;

public interface UserService {

    UserResponse getUserById(UUID userId);

    PagedResponse<UserResponse> getAllUsers(int page, int size);

    PagedResponse<UserResponse> getUsersByRole(Role role, int page, int size);

    PagedResponse<UserResponse> getUsersByHostelAndRole(UUID hostelId, Role role, int page, int size);

    UserResponse updateUser(UUID userId, UpdateUserRequest request, User currentUser);

    void deleteUser(UUID userId, User currentUser);

    UserResponse toggleActive(UUID userId, User admin);
}
