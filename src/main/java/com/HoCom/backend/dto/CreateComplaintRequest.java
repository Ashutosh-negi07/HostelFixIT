package com.HoCom.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

import com.HoCom.backend.models.Complaint.Priority;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateComplaintRequest {

    @NotNull(message = "Category ID is required")
    private UUID categoryId;

    @NotBlank(message = "Description is required")
    private String description;

    private String photoUrl;

    @Builder.Default
    private Priority priority = Priority.NORMAL;
}
