package com.HoCom.backend.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackResponse {

    private UUID id;
    private UUID complaintId;
    private Integer rating;
    private String comment;
    private Instant createdAt;
}
