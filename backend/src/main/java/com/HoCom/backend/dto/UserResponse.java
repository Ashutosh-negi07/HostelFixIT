package com.HoCom.backend.dto;

import com.HoCom.backend.models.User.Role;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private UUID id;
    private String name;
    private Long phone;
    private String email;
    private Role role;
    private UUID hostelId;
    private String hostelName;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
}
