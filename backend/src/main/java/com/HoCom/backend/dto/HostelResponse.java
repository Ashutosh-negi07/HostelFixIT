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
    private Instant createdAt;
}
