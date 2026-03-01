package com.HoCom.Fixit.service;

import com.HoCom.Fixit.dto.AuthResponse;
import com.HoCom.Fixit.dto.CreateUserRequest;
import com.HoCom.Fixit.dto.LoginRequest;
import com.HoCom.Fixit.models.User;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse createUser(CreateUserRequest request, User createdBy);
}
