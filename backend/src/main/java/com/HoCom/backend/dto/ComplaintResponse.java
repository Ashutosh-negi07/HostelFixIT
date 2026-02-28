package com.HoCom.backend.dto;

import com.HoCom.backend.models.Complaint.Priority;
import com.HoCom.backend.models.Complaint.Status;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintResponse {

    private UUID id;
    private UUID studentId;
    private String studentName;
    private UUID assignedWorkerId;
    private String assignedWorkerName;
    private UUID hostelId;
    private String hostelName;
    private UUID categoryId;
    private String categoryName;
    private String description;
    private String photoUrl;
    private Status status;
    private Priority priority;
    // private Integer escalationCount; // Escalation feature — reserved for future use
    private Instant createdAt;
    private Instant updatedAt;
    private Instant resolvedAt;
}
