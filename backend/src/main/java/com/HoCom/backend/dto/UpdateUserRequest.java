package com.HoCom.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.UUID;

import com.HoCom.backend.models.User.Role;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserRequest {

    @Size(min = 2, message = "Name must be at least 2 characters")
    private String name;
    private Long phone;
    @Email(message = "Invalid email format")
    private String email;
    private String oldPassword;
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    private Role role;
    private UUID hostelId;
    private Boolean isActive;
}
