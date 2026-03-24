package com.HoCom.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintCountResponse {

    private long pending;
    private long assigned;
    private long inProgress;
    private long resolved;
    private long rejected;
    private long total;
}
