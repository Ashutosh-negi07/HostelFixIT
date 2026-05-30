package com.HoCom.backend.controller;

import com.HoCom.backend.Config.JwtUtil;
import com.HoCom.backend.dto.AuthResponse;
import com.HoCom.backend.dto.LoginRequest;
import com.HoCom.backend.dto.UserResponse;
import com.HoCom.backend.models.User;
import com.HoCom.backend.service.AuthService;
import com.HoCom.backend.service.TokenBlacklistService;
import com.HoCom.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final TokenBlacklistService tokenBlacklistService;
    private final JwtUtil jwtUtil;
    private final UserService userService;

    // ═══════════════════════════════════════════
    //  CURRENT USER
    // ═══════════════════════════════════════════

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.getUserById(currentUser.getId()));
    }

    // ═══════════════════════════════════════════
    //  LOGIN / LOGOUT
    // ═══════════════════════════════════════════

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.isTokenValid(token)) {
                long expiry = jwtUtil.extractAllClaims(token).getExpiration().getTime();
                tokenBlacklistService.blacklist(token, expiry);
            }
        }
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
