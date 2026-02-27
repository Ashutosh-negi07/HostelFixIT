package com.HoCom.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignWorkerRequest {

    @NotNull(message = "Worker ID is required")
    private UUID workerId;
}
