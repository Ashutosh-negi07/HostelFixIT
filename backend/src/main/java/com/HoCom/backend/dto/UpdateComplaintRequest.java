package com.HoCom.backend.dto;

import com.HoCom.backend.models.Complaint.Priority;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateComplaintRequest {

    private UUID categoryId;
    private String description;
    private String photoUrl;
    private Priority priority;
}
