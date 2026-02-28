package com.HoCom.backend.dto;

import com.HoCom.backend.models.Complaint.Status;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintStatusHistoryResponse {

    private UUID id;
    private UUID complaintId;
    private Status oldStatus;
    private Status newStatus;
    private UUID changedById;
    private String changedByName;
    private Instant changedAt;
}
