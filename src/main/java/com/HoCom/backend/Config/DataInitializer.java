package com.HoCom.backend.Config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.HoCom.backend.models.Category;
import com.HoCom.backend.models.users;
import com.HoCom.backend.models.users.Role;
import com.HoCom.backend.repositories.CategoryRepository;
import com.HoCom.backend.repositories.UserRepository;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        String adminEmail = "admin@hocom.com";

        if (!userRepository.existsByEmail(adminEmail)) {
            users admin = users.builder()
                    .name("admin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("123"))
                    .role(Role.ADMIN)
                    .isActive(true)
                    .build();

            userRepository.save(admin);
            System.out.println(">>> Default ADMIN user created — email: admin@hocom.com / password: 123");
        }

        // Seed default categories
        List<String> defaultCategories = List.of(
                "Plumbing", "Electrical", "Cleaning", "Furniture",
                "Internet", "Security", "Maintenance", "Other"
        );

        for (String catName : defaultCategories) {
            if (!categoryRepository.existsByName(catName)) {
                categoryRepository.save(Category.builder().name(catName).build());
            }
        }
        System.out.println(">>> Categories seeded: " + categoryRepository.count() + " total");
    }
}
