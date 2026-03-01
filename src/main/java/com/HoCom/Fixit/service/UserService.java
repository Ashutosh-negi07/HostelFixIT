package com.HoCom.Fixit.service;

import java.util.List;
import java.util.UUID;

import com.HoCom.Fixit.dto.UpdateUserRequest;
import com.HoCom.Fixit.dto.UserResponse;
import com.HoCom.Fixit.models.User;
import com.HoCom.Fixit.models.User.Role;

public interface UserService {

    UserResponse getUserById(UUID userId);

    List<UserResponse> getAllUsers();

    List<UserResponse> getUsersByRole(Role role);

    List<UserResponse> getUsersByHostelAndRole(UUID hostelId, Role role);

    UserResponse updateUser(UUID userId, UpdateUserRequest request, User currentUser);

    void deleteUser(UUID userId, User currentUser);
}
