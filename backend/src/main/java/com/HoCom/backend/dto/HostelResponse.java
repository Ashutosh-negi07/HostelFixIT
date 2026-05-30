package com.HoCom.backend.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HostelResponse {

    private UUID id;
    private String name;
    private String address;
    private UUID adminId;
    private String adminName;
    private Instant createdAt;

    // Aggregate counts shown on hostel cards
    private long totalStudents;
    private long totalWorkers;
    private long totalComplaints;
}

