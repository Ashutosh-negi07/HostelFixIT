package com.HoCom.backend.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private UUID id;
    private String title;
    private String message;
    private Boolean isRead;
    private UUID referenceId;
    private String referenceType;
    private Instant createdAt;
}
