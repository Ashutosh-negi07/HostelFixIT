# HostelFixIT — Security Guide

> **Purpose:** A complete reference to every security mechanism in the HostelFixIT backend — how authentication, authorization, token management, input validation, and error handling work, and the reasoning behind each decision.

---

## Table of Contents

1. [Security Overview](#1-security-overview)
2. [Password Security](#2-password-security)
3. [JWT — Token Issuance](#3-jwt--token-issuance)
4. [JWT — Token Validation (JwtAuthFilter)](#4-jwt--token-validation-jwtauthfilter)
5. [Token Blacklisting (Logout)](#5-token-blacklisting-logout)
6. [Spring Security Filter Chain](#6-spring-security-filter-chain)
7. [Role-Based Access Control (RBAC)](#7-role-based-access-control-rbac)
8. [Service-Level Scope Enforcement](#8-service-level-scope-enforcement)
9. [Input Validation](#9-input-validation)
10. [Error Handling & Message Safety](#10-error-handling--message-safety)
11. [CORS Policy](#11-cors-policy)
12. [Session Management](#12-session-management)
13. [Role Mismatch Detection](#13-role-mismatch-detection)
14. [Deactivated Account Protection](#14-deactivated-account-protection)
15. [Actuator & Swagger Exposure](#15-actuator--swagger-exposure)
16. [Security Decision Log](#16-security-decision-log)

---

## 1. Security Overview

The HostelFixIT backend uses a **stateless JWT-based authentication** model with multi-layer authorization:

```
┌────────────────────────────────────────────────────────────────┐
│                       Security Layers                           │
├────────────────────────────────────────────────────────────────┤
│ Layer 1 │ CORS Preflight                                        │
│ Layer 2 │ JwtAuthFilter — token validation + SecurityContext    │
│ Layer 3 │ Spring Security URL rules — role-level gate by prefix │
│ Layer 4 │ Service-level scope checks — hostel/owner enforcement │
│ Layer 5 │ Jakarta Bean Validation — request payload sanitization│
│ Layer 6 │ GlobalExceptionHandler — safe error messages          │
└────────────────────────────────────────────────────────────────┘
```

No layer is skipped — a request must pass **all applicable layers** to succeed.

---

## 2. Password Security

### Algorithm: BCrypt

All passwords are hashed with **BCrypt** before being stored:

```java
// SecurityConfig.java — exposes the encoder as a Spring bean
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

BCrypt is used throughout the system:

| Operation | Code |
|---|---|
| **Create user** | `passwordEncoder.encode(request.getPassword())` → stored |
| **Login** | `passwordEncoder.matches(rawPassword, storedHash)` |
| **Change password** | `passwordEncoder.matches(oldPassword, stored)` then `encode(newPassword)` |

### Why BCrypt?
- **Salted by design** — each hash is unique even for identical passwords.
- **Adaptive cost** — the work factor can be increased as hardware gets faster.
- **Spring standard** — integrates natively with `PasswordEncoder` abstraction.

### Password field protection
The `User` entity's `password` field is annotated with `@JsonIgnore`, preventing it from ever being serialised into a JSON response:

```java
@JsonIgnore
@Column(nullable = false)
private String password;
```

---

## 3. JWT — Token Issuance

**File:** `JwtUtil.java`

### Token generation

```java
public String generateToken(UUID userId, String email, String role) {
    return Jwts.builder()
            .subject(email)               // sub claim
            .claim("userId", userId)      // custom claim
            .claim("role", role)          // custom claim: raw enum name e.g. "STUDENT"
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(getSigningKey())     // HMAC-SHA signed
            .compact();
}
```

### Signing key
```java
private SecretKey getSigningKey() {
    return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
}
```
The secret is read from `jwt.secret` (set via `JWT_SECRET` env var). The recommended minimum length is **64 hex characters (256+ bits)** for HMAC-SHA256 security.

### Token lifetime
```properties
jwt.expiration=86400000   # 24 hours in milliseconds
```

### What's in the token (decoded payload)

```json
{
  "sub": "student@hostel.com",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "STUDENT",
  "iat": 1720000000,
  "exp": 1720086400
}
```

> ⚠️ **JWT payloads are base64-encoded, not encrypted.** Never put sensitive data (full names, passwords, PII) in JWT claims. The signature only proves the token wasn't tampered with — it doesn't hide its contents.

---

## 4. JWT — Token Validation (JwtAuthFilter)

**File:** `JwtAuthFilter.java` — extends `OncePerRequestFilter`

The filter runs **once per request**, before Spring Security's built-in filters.

### Validation pipeline

```
Incoming Request
      │
      ▼
Is "Authorization: Bearer <token>" header present?
      │ No → skip filter, continue (unauthenticated)
      │ Yes
      ▼
jwtUtil.isTokenValid(token)
  ├── parse JWT, verify HMAC-SHA signature
  ├── check expiration date
  │   └── if invalid/expired → skip filter, continue
      │
      ▼
tokenBlacklistService.isBlacklisted(token)
  └── if blacklisted (logged out) → skip filter, continue
      │
      ▼
Extract: email, role, userId from claims
      │
      ▼
userRepository.findById(userId)     ← DB lookup by UUID
      │
      ▼
Is user found AND user.isActive == true?
      │ No → skip filter, continue (no SecurityContext set)
      │ Yes
      ▼
Does JWT role claim == user.role in DB?  ← Role mismatch check
      │ No → skip filter (stale token)
      │ Yes
      ▼
Build UsernamePasswordAuthenticationToken:
  principal = User entity
  credentials = null
  authorities = [SimpleGrantedAuthority("ROLE_" + role)]
      │
      ▼
SecurityContextHolder.setContext(authToken)
      │
      ▼
Continue to next filter / controller
```

### Why a DB lookup on every request?

Loading the `User` entity from the DB on every request enables:
1. **Deactivated account detection** — `isActive` check cannot be done with just the token.
2. **Role mismatch detection** — if a user's role is changed after token issuance, the stale token is rejected.
3. **`@AuthenticationPrincipal User currentUser`** — controllers receive the full entity, not just an ID string.

The trade-off is **one DB query per request**. This is acceptable for the current scale; a cache layer (Redis) could be added to reduce this cost at higher traffic.

---

## 5. Token Blacklisting (Logout)

**File:** `TokenBlacklistService.java`

### Implementation

```java
// In-memory store: token string → expiry timestamp (ms)
private final Map<String, Long> blacklist = new ConcurrentHashMap<>();

public void blacklist(String token, long expiryMillis) {
    blacklist.put(token, expiryMillis);
}

public boolean isBlacklisted(String token) {
    return blacklist.containsKey(token);
}

// Scheduled cleanup — runs every 10 minutes
@Scheduled(fixedRate = 600_000)
public void purgeExpired() {
    long now = System.currentTimeMillis();
    blacklist.entrySet().removeIf(entry -> entry.getValue() < now);
}
```

### Logout flow

```
POST /api/auth/logout (Bearer <token>)
  → AuthController.logout()
      ├── reads token from Authorization header
      ├── jwtUtil.isTokenValid(token)        // verify it's a valid token
      ├── extract expiry via extractAllClaims().getExpiration().getTime()
      └── tokenBlacklistService.blacklist(token, expiryMs)

Next request with same token:
  → JwtAuthFilter: tokenBlacklistService.isBlacklisted(token) == true
  → Skip auth → 401 Unauthorized
```

### Why blacklist until natural expiry?

A JWT is cryptographically valid until it expires. There is no way to "cancel" it otherwise. The blacklist bridges this gap. Tokens are kept until their `exp` claim time, after which they'd be rejected by `isTokenValid()` anyway and are pruned from the map by the scheduler.

### Limitation: In-Memory Store

The current blacklist is **not shared across multiple server instances**. In a load-balanced/multi-node deployment, a logged-out token could still be accepted by another node. The fix is to replace `ConcurrentHashMap` with a **Redis SET** with TTL:

```java
// Production upgrade path:
redisTemplate.opsForValue().set("blacklist:" + token, "1", ttl, TimeUnit.MILLISECONDS);
```

---

## 6. Spring Security Filter Chain

**File:** `SecurityConfig.java`

### Session policy

```java
.sessionManagement(session ->
    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
)
```

No `HttpSession` is created or used. Every request is fully self-contained via JWT.

### Disabled security features

```java
.csrf(AbstractHttpConfigurer::disable)    // CSRF not needed — no cookies/sessions
.formLogin(AbstractHttpConfigurer::disable)
.httpBasic(AbstractHttpConfigurer::disable)
```

CSRF protection is designed for browser session cookies. Since this API uses `Authorization: Bearer` headers (not cookies), CSRF does not apply.

### URL authorization rules (evaluated top-to-bottom)

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/auth/login").permitAll()
    .requestMatchers("/api/auth/logout").permitAll()
    .requestMatchers("/api/auth/me").authenticated()
    .requestMatchers("/error").permitAll()
    .requestMatchers("/actuator/health").permitAll()
    .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
    .requestMatchers("/api/superadmin/**").hasRole("SUPER_ADMIN")
    .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
    .requestMatchers("/api/dashboard/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "WARDEN")
    .requestMatchers("/api/warden/**").hasRole("WARDEN")
    .requestMatchers("/api/worker/**").hasRole("WORKER")
    .requestMatchers("/api/student/**").hasRole("STUDENT")
    .requestMatchers("/api/notifications/**").authenticated()
    .anyRequest().authenticated()
)
```

> **Note:** `hasRole("STUDENT")` internally checks for the authority `ROLE_STUDENT`. The `JwtAuthFilter` adds this prefix: `new SimpleGrantedAuthority("ROLE_" + role)`.

### Exception handlers

```java
.exceptionHandling(ex -> ex
    .authenticationEntryPoint((req, res, ex) ->
        res.sendError(SC_UNAUTHORIZED, "Unauthorized"))   // 401
    .accessDeniedHandler((req, res, ex) ->
        res.sendError(SC_FORBIDDEN, "Access Denied"))     // 403
)
```

These fire **after** the filter chain, for standard Spring Security rejections:
- **401** — no valid token / user not authenticated.
- **403** — valid token but wrong role for the URL.

---

## 7. Role-Based Access Control (RBAC)

### Role Definitions

| Role | Description | Scope |
|---|---|---|
| `SUPER_ADMIN` | Platform owner | Global — all hostels, all admins |
| `ADMIN` | Hostel operator | Their assigned hostels only |
| `WARDEN` | Floor/block supervisor | Their single assigned hostel |
| `WORKER` | Maintenance staff | Only their assigned complaints |
| `STUDENT` | Resident | Only their own complaints |

### Role Hierarchy in User Creation

```
SUPER_ADMIN can create: ADMIN, WARDEN, WORKER, STUDENT
ADMIN       can create: WARDEN, WORKER, STUDENT  (NOT ADMIN, NOT SUPER_ADMIN)
WARDEN      can create: STUDENT, WORKER           (NOT WARDEN, NOT ADMIN, NOT SUPER_ADMIN)
```

Enforced in `AuthServiceImpl.createUser()`:
```java
if (creatorRole == Role.ADMIN) {
    if (targetRole == Role.ADMIN || targetRole == Role.SUPER_ADMIN) {
        throw new RuntimeException("ADMIN cannot create another ADMIN or SUPER_ADMIN");
    }
}
```

### Admin URL overlap

`/api/admin/**` allows both `ADMIN` and `SUPER_ADMIN`. This lets a SUPER_ADMIN use admin-level endpoints (e.g., to manage any hostel) without needing separate SUPER_ADMIN-specific endpoints for every admin operation.

---

## 8. Service-Level Scope Enforcement

URL rules prevent wrong-role access. Service-level checks prevent **same-role cross-tenant access** (e.g., Warden A accessing Warden B's hostel data).

### Hostel Scope (Warden)
```java
// ComplaintServiceImpl — every warden operation:
if (warden.getHostel() == null
        || !complaint.getHostel().getId().equals(warden.getHostel().getId())) {
    throw new RuntimeException("You can only manage complaints in your hostel");
}
```

### Hostel Scope (Admin)
```java
// AdminController → hostelService.getScopedHostelIds(currentUser)
// In HostelServiceImpl:
if (currentUser.getRole() == Role.ADMIN) {
    return hostelRepository.findByAdmin(currentUser)
            .stream().map(Hostel::getId).toList();
} else {
    return hostelRepository.findAll().stream().map(Hostel::getId).toList();
}
```
Admin queries are always pre-filtered with this scoped ID list.

### Own-Resource Enforcement (Student)
```java
// Student can only view/edit/cancel their own complaints:
if (!complaint.getStudent().getId().equals(currentUser.getId())) {
    throw new RuntimeException("You can only view your own complaints");
}
```

### Own-Resource Enforcement (Worker)
```java
// Worker can only act on complaints assigned to them:
if (complaint.getAssignedWorker() == null
        || !complaint.getAssignedWorker().getId().equals(worker.getId())) {
    throw new RuntimeException("This complaint is not assigned to you");
}
```

---

## 9. Input Validation

### Jakarta Bean Validation on DTOs

All request DTOs carry validation annotations. The `@Valid` annotation in controller method parameters triggers validation before the controller body runs:

```java
// Controller:
@PostMapping("/login")
public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request)

// DTO:
public class LoginRequest {
    @NotBlank  String email;
    @NotBlank  String password;
}

public class CreateFeedbackRequest {
    @NotNull              UUID complaintId;
    @NotNull @Min(1) @Max(5) Integer rating;
    String comment;   // optional
}
```

Validation failures throw `MethodArgumentNotValidException`, caught by `GlobalExceptionHandler` and returned as:
```json
{ "error": "rating: must be between 1 and 5; complaintId: must not be null" }
```

### Multipart file validation

For photo uploads, size limits are enforced at the servlet layer:
```properties
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

Files exceeding 10 MB are rejected before reaching the controller.

### Priority enum parsing
```java
// StudentController — explicit enum parsing with clear error:
Complaint.Priority.valueOf(priority.toUpperCase())
// If value is invalid → IllegalArgumentException → caught by GlobalExceptionHandler
```

---

## 10. Error Handling & Message Safety

**File:** `GlobalExceptionHandler.java`

### The Problem: Information Leakage

Exposing raw exception messages to the client can leak internal implementation details — table names, query structure, server paths, or even stack traces. This is an **OWASP Top 10** security concern (A05: Security Misconfiguration).

### The Solution: SAFE_MESSAGES allowlist

```java
private static final Set<String> SAFE_MESSAGES = Set.of(
    "Invalid email or password",
    "Account is deactivated",
    "Complaint not found",
    "Only PENDING complaints can be updated",
    "This complaint is not assigned to you",
    // ... ~40 known-safe messages
);
```

The handler checks if the exception message is in the allowlist:

```java
if (message != null && (SAFE_MESSAGES.contains(message)
        || message.contains("not found")
        || message.contains("already exists")
        || message.startsWith("Complaint is already"))) {
    clientMessage = message;      // safe to expose
} else {
    log.error("Unhandled RuntimeException", ex);  // log internally
    clientMessage = "An unexpected error occurred"; // generic to client
}
```

Unexpected exceptions are **logged server-side** but only a generic message is sent to the client.

### HTTP status mapping

```java
// Smart status code mapping from message content:
if (message.contains("not found"))                → 404 NOT FOUND
if (message.contains("no permission") || ...)     → 403 FORBIDDEN
if (message.contains("already"))                  → 409 CONFLICT
else                                               → 400 BAD REQUEST
```

This is a pragmatic heuristic-based approach. A production improvement would use typed custom exceptions (`NotFoundException extends RuntimeException`) for deterministic status codes.

---

## 11. CORS Policy

**File:** `SecurityConfig.corsConfigurationSource()`

```java
CorsConfiguration config = new CorsConfiguration();
config.setAllowedOrigins(List.of(allowedOrigins.split(",")));
config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
config.setAllowCredentials(true);
```

Configured via `cors.allowed-origins` env var (default: `http://localhost:3000`).

**Current production value in `.env`:**
```
CORS_ORIGINS=http://localhost:3000,http://192.168.1.2:3000
```

### Why `allowCredentials(true)`?
Required if the browser ever needs to send cookies alongside the request (e.g., future cookie-based auth). With `Authorization: Bearer` headers, credentials mode is technically not needed but doesn't cause harm.

### Production hardening note
Before going live, `CORS_ORIGINS` should be set to the **exact production frontend URL** only. Wildcards (`*`) cannot be used with `allowCredentials(true)`.

---

## 12. Session Management

```java
.sessionManagement(session ->
    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
)
```

Spring Security will **never create an `HttpSession`**. Every request must carry its JWT — there is no server-side session storage. This makes the backend:
- **Horizontally scalable** — any node can serve any request.
- **Free of CSRF risk** — no session cookies to steal.
- **Simpler to reason about** — the token is the entire auth state.

---

## 13. Role Mismatch Detection

A subtle but important security check inside `JwtAuthFilter`:

```java
// After loading user from DB:
String currentRole = user.getRole().name();  // role in database NOW
if (!currentRole.equals(tokenRole)) {         // role in the JWT (at login time)
    filterChain.doFilter(request, response);  // skip auth → request fails
    return;
}
```

**Scenario this prevents:** An admin promotes a student to warden. The student still has the old JWT with `"role": "STUDENT"`. On their next request, the filter detects the mismatch and rejects the token. The user must log in again to get a token reflecting their new role.

**Reverse scenario:** A warden is demoted to student. Their warden-role JWT is immediately rendered useless — the mismatch check blocks it before any warden endpoint even gets a chance to evaluate it.

---

## 14. Deactivated Account Protection

Checked in two places:

**1. At login** (`AuthServiceImpl.login()`):
```java
if (!user.getIsActive()) {
    throw new RuntimeException("Account is deactivated");
}
// No token is issued
```

**2. On every request** (`JwtAuthFilter`):
```java
if (user != null && user.getIsActive()) {
    // set SecurityContext
}
// If isActive == false → no SecurityContext set → 401
```

A user can be disabled mid-session (by Admin calling `PUT /api/admin/users/{id}/toggle-active`). The next request with their existing token will fail at Layer 2 (JwtAuthFilter) because `isActive` is checked from the live DB — not from the JWT.

---

## 15. Actuator & Swagger Exposure

### Actuator

Only the `health` endpoint is exposed:
```properties
management.endpoints.web.exposure.include=health
management.endpoint.health.show-details=never
```

`/actuator/health` returns `{ "status": "UP" }` and is `permitAll` — safe for load balancer health checks with zero information leakage.

All other actuator endpoints (metrics, env, beans, etc.) are **disabled** and not accessible.

### Swagger UI

Swagger is `permitAll` so API consumers can browse endpoints without auth:
```
/v3/api-docs      → raw OpenAPI JSON
/swagger-ui.html  → interactive UI
```

`OpenApiConfig.java` configures the Swagger UI to include a **bearer token input field**, so authenticated endpoints can be tested directly from the UI.

> For production, consider restricting Swagger behind an IP allowlist or disabling it entirely with `springdoc.api-docs.enabled=false`.

---

## 16. Security Decision Log

| Decision | Chosen Approach | Reason |
|---|---|---|
| Auth mechanism | JWT (stateless) | Scales horizontally; no server-side session store needed |
| JWT signing | HMAC-SHA | Symmetric — simpler than RSA; sufficient for single-service auth |
| Token expiry | 24 hours | Balances UX (not too short) with security (not too long) |
| Logout | In-memory blacklist | Bridges JWT stateless limitation; Redis upgrade path clear |
| Password hashing | BCrypt | Industry standard; salted + adaptive cost |
| Role storage | JWT claim (enum string) | Avoids DB lookup just for role; mismatch check adds role-change detection |
| CSRF | Disabled | Correct — no session cookies; `Authorization` header only |
| Sessions | STATELESS | Required for JWT to make sense |
| Error messages | SAFE_MESSAGES allowlist | Prevents information leakage (OWASP A05) |
| Input validation | Jakarta Bean Validation | Declarative, consistent, framework-standard |
| Multipart size | 10 MB limit | Prevents denial-of-service via large file uploads |
| Scope enforcement | Two layers (URL + service) | Defense in depth — URL rules are coarse, service checks are precise |
| Actuator | Health only | Minimal exposure surface in production |
