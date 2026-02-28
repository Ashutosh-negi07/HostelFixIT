package com.HoCom.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCategoryRequest {

    @Size(min = 1, message = "Category name must not be empty")
    private String name;
    private String description;
}
