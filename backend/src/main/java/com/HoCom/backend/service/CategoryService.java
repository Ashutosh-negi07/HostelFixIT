package com.HoCom.backend.service;

import com.HoCom.backend.dto.CategoryResponse;
import com.HoCom.backend.dto.CreateCategoryRequest;
import com.HoCom.backend.dto.UpdateCategoryRequest;

import java.util.List;
import java.util.UUID;

public interface CategoryService {

    CategoryResponse createCategory(CreateCategoryRequest request);

    CategoryResponse updateCategory(UUID categoryId, UpdateCategoryRequest request);

    CategoryResponse getCategoryById(UUID categoryId);

    List<CategoryResponse> getAllCategories();

    void deleteCategory(UUID categoryId);
}
