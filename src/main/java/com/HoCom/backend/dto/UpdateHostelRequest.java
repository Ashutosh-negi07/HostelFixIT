package com.HoCom.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateHostelRequest {

    private String name;
    private String address;
}
