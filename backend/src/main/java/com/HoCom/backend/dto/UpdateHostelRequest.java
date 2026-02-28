package com.HoCom.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateHostelRequest {

    @Size(min = 1, message = "Hostel name must not be empty")
    private String name;
    private String address;
}
