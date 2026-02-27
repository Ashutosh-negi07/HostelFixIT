package com.HoCom.backend.dto;

import com.HoCom.backend.models.users.Role;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private UUID userId;
    private String name;
    private String email;
    private Role role;
    private String message;
}
