package com.HoCom.backend.dto;

import lombok.*;

import java.util.UUID;

import com.HoCom.backend.models.users.Role;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserRequest {

    private String name;
    private Long phone;
    private String email;
    private String password;
    private Role role;
    private UUID hostelId;
    private Boolean isActive;
}
