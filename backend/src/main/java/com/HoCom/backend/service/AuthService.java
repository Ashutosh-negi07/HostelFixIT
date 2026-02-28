package com.HoCom.backend.service;

import com.HoCom.backend.dto.AuthResponse;
import com.HoCom.backend.dto.CreateUserRequest;
import com.HoCom.backend.dto.LoginRequest;
import com.HoCom.backend.models.User;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse createUser(CreateUserRequest request, User createdBy);
}
