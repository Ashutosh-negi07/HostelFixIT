package com.HoCom.backend.Config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.HoCom.backend.models.Category;
import com.HoCom.backend.models.User;
import com.HoCom.backend.models.User.Role;
import com.HoCom.backend.repositories.CategoryRepository;
import com.HoCom.backend.repositories.UserRepository;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${ADMIN_DEFAULT_PASSWORD:CHANGE_ME}")
    private String adminDefaultPassword;

    @Value("${SUPER_ADMIN_DEFAULT_PASSWORD:CHANGE_ME}")
    private String superAdminDefaultPassword;

    @Override
    public void run(String... args) {

        // ── Seed ADMIN ───────────────────────────────────────────────────────
        String adminEmail = "admin@hocom.com";
        User existingAdmin = userRepository.findByEmail(adminEmail).orElse(null);
        if (existingAdmin == null) {
            userRepository.save(User.builder()
                    .name("admin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminDefaultPassword))
                    .role(Role.ADMIN)
                    .isActive(true)
                    .build());
            System.out.println(">>> Default ADMIN user created — email: " + adminEmail);
        } else {
            existingAdmin.setPassword(passwordEncoder.encode(adminDefaultPassword));
            userRepository.save(existingAdmin);
            System.out.println(">>> ADMIN password reset to default");
        }

        // ── Seed SUPER_ADMIN ─────────────────────────────────────────────────
        String superAdminEmail = "superadmin@hostelfixit.com";
        User existingSuperAdmin = userRepository.findByEmail(superAdminEmail).orElse(null);
        if (existingSuperAdmin == null) {
            userRepository.save(User.builder()
                    .name("Super Admin")
                    .email(superAdminEmail)
                    .password(passwordEncoder.encode(superAdminDefaultPassword))
                    .role(Role.SUPER_ADMIN)
                    .isActive(true)
                    .build());
            System.out.println(">>> SUPER_ADMIN created — email: " + superAdminEmail);
        } else {
            existingSuperAdmin.setPassword(passwordEncoder.encode(superAdminDefaultPassword));
            userRepository.save(existingSuperAdmin);
            System.out.println(">>> SUPER_ADMIN password reset to default");
        }

        // ── Seed default categories ───────────────────────────────────────────
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
