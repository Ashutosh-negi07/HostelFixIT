package com.HoCom.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateHostelRequest {

    @NotBlank(message = "Hostel name is required")
    private String name;

    private String address;
}
