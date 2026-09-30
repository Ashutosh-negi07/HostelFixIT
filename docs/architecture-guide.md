# HostelFixIT — Backend Architecture Guide

> **Purpose:** A deep-dive reference into the backend architecture, design decisions, and structural patterns of HostelFixIT. Useful for onboarding, code reviews, and technical interviews.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Package Structure](#3-package-structure)
4. [Layered Architecture](#4-layered-architecture)
5. [Domain Model](#5-domain-model)
6. [Security Architecture](#6-security-architecture)
7. [Service Layer Patterns](#7-service-layer-patterns)
8. [Repository Layer](#8-repository-layer)
9. [DTO Layer](#9-dto-layer)
10. [Notification System](#10-notification-system)
11. [File Storage (Cloudinary)](#11-file-storage-cloudinary)
12. [Database & Migrations](#12-database--migrations)
13. [Configuration & Bootstrap](#13-configuration--bootstrap)
14. [Error Handling](#14-error-handling)
15. [CORS & API Docs](#15-cors--api-docs)
16. [Request Flow Diagram](#16-request-flow-diagram)

---

## 1. Project Overview

**HostelFixIT** (HoCom) is a hostel complaint management system. It enables:

- **Students** to file, track, and leave feedback on maintenance complaints.
- **Workers** to receive, action, and resolve assigned complaints.
- **Wardens** to manage complaints within their hostel — assign, reject, or reassign.
- **Admins** to manage users, hostels, and categories across their hostels.
- **Super Admins** to manage the entire platform — all admins, hostels, and global stats.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Language | Java 17 |
| Framework | Spring Boot 4.0.2 |
| Web | Spring MVC (`spring-boot-starter-webmvc`) |
| Security | Spring Security + custom JWT filter |
| JWT | JJWT (jjwt-api, jjwt-impl, jjwt-jackson) v0.12.6 |
| ORM | Spring Data JPA (Hibernate) |
| Database | PostgreSQL |
| Migrations | Flyway (`flyway-core` + `flyway-database-postgresql`) |
| Photo Storage | Cloudinary (`cloudinary-http44` v1.39.0) |
| Validation | Jakarta Bean Validation (`spring-boot-starter-validation`) |
| Boilerplate reduction | Lombok |
| API Documentation | SpringDoc OpenAPI v3 (Swagger UI) |
| Health Checks | Spring Actuator |
| Build Tool | Maven (with Maven Wrapper) |

---

## 3. Package Structure

```
com.HoCom.backend
├── HoComApplication.java          ← Spring Boot entry point
│
├── Config/                        ← Cross-cutting infrastructure
│   ├── SecurityConfig.java        ← Spring Security filter chain, CORS, role rules
│   ├── JwtAuthFilter.java         ← Custom OncePerRequestFilter for JWT validation
│   ├── JwtUtil.java               ← JWT token generation & parsing
│   ├── TokenBlacklistService.java ← (in service/) logout token blacklist
│   ├── Cloudinaryconfig.java      ← Cloudinary SDK bean configuration
│   ├── OpenApiConfig.java         ← Swagger/OpenAPI metadata
│   ├── GlobalExceptionHandler.java← @RestControllerAdvice for unified errors
│   └── DataInitializer.java       ← CommandLineRunner for seed data
│
├── controller/                    ← HTTP boundary — one controller per role
│   ├── AuthController.java        ← /api/auth/**
│   ├── StudentController.java     ← /api/student/**
│   ├── WorkerController.java      ← /api/worker/**
│   ├── WardenController.java      ← /api/warden/**
│   ├── AdminController.java       ← /api/admin/**
│   ├── SuperAdminController.java  ← /api/superadmin/**
│   ├── DashboardController.java   ← /api/dashboard/**
│   └── NotificationController.java← /api/notifications/**
│
├── service/                       ← Business logic — interface + impl pairs
│   ├── AuthService.java / AuthServiceImpl.java
│   ├── ComplaintService.java / ComplaintServiceImpl.java  ← largest service
│   ├── UserService.java / UserServiceImpl.java
│   ├── HostelService.java / HostelServiceImpl.java
│   ├── CategoryService.java / CategoryServiceImpl.java
│   ├── FeedbackService.java / FeedbackServiceImpl.java
│   ├── DashboardService.java / DashboardServiceImpl.java
│   ├── NotificationService.java / NotificationServiceImpl.java
│   ├── CloudinaryService.java     ← single class, no interface needed
│   └── TokenBlacklistService.java ← in-memory/Redis token blacklist
│
├── models/                        ← JPA entities
│   ├── User.java
│   ├── Hostel.java
│   ├── Complaint.java
│   ├── Category.java
│   ├── Feedback.java
│   ├── Notification.java
│   └── ComplaintStatusHistory.java
│
├── repositories/                  ← Spring Data JPA repositories
│   ├── UserRepository.java
│   ├── HostelRepository.java
│   ├── ComplaintRepository.java
│   ├── CategoryRepository.java
│   ├── FeedbackRepository.java
│   ├── NotificationRepository.java
│   ├── ComplaintStatusHistoryRepository.java
│   └── ComplaintSpecification.java ← JPA Criteria API Specification
│
└── dto/                           ← Request/Response DTOs (23 classes)
    ├── LoginRequest.java
    ├── AuthResponse.java
    ├── CreateUserRequest.java / UpdateUserRequest.java / UserResponse.java
    ├── CreateComplaintRequest.java / UpdateComplaintRequest.java / ComplaintResponse.java
    ├── CreateHostelRequest.java / UpdateHostelRequest.java / HostelResponse.java
    ├── CreateCategoryRequest.java / UpdateCategoryRequest.java / CategoryResponse.java
    ├── CreateFeedbackRequest.java / FeedbackResponse.java
    ├── AssignWorkerRequest.java / ReassignWorkerRequest.java
    ├── NotificationResponse.java
    ├── DashboardStatsResponse.java
    ├── ComplaintCountResponse.java
    ├── ComplaintStatusHistoryResponse.java
    └── PagedResponse.java         ← Generic paginated wrapper
```

---

## 4. Layered Architecture

```
┌─────────────────────────────────────────────┐
│              Client (Browser / Mobile)      │
└─────────────────────┬───────────────────────┘
                      │ HTTP Request
┌─────────────────────▼───────────────────────┐
│           Spring Security Filter Chain       │
│  JwtAuthFilter → CORS → Authorization Rules  │
└─────────────────────┬───────────────────────┘
                      │ Authenticated Request
┌─────────────────────▼───────────────────────┐
│           Controller Layer (@RestController) │
│  Maps HTTP requests → Service calls          │
│  Handles: URL params, path vars, multipart   │
│  Injects: @AuthenticationPrincipal User      │
└─────────────────────┬───────────────────────┘
                      │ Method call
┌─────────────────────▼───────────────────────┐
│           Service Layer (@Service)            │
│  Contains all business logic & validation    │
│  Orchestrates: repositories, notifications   │
│  Transactions: @Transactional on mutations   │
└──────┬──────────────┬───────────────┬────────┘
       │              │               │
┌──────▼─────┐ ┌──────▼──────┐ ┌─────▼──────┐
│ Repository │ │ Notification│ │ Cloudinary │
│  (JPA)     │ │  Service    │ │  Service   │
└──────┬─────┘ └─────────────┘ └────────────┘
       │
┌──────▼───────────────────────────────────────┐
│           PostgreSQL Database                 │
│  Schema managed by Flyway migrations          │
└──────────────────────────────────────────────┘
```

**Design principles:**
- **No business logic in controllers** — controllers are thin routers.
- **No JPA queries in controllers** — all DB access goes through repositories.
- **Interface-based services** — `ComplaintService` interface + `ComplaintServiceImpl` for testability and loose coupling.
- **DTOs decouple the API** from the JPA entity model — entities are never serialized directly to JSON.

---

## 5. Domain Model

### Entity Relationship Diagram

```
SUPER_ADMIN ──(manages)──> ADMIN
ADMIN ──(owns)──> HOSTEL (0..*)
HOSTEL ──(has)──> WARDEN (0..*), STUDENT (0..*), WORKER (0..*)

STUDENT ──(files)──> COMPLAINT
COMPLAINT ──(belongs to)──> HOSTEL
COMPLAINT ──(assigned to)──> WORKER (optional)
COMPLAINT ──(categorized by)──> CATEGORY
COMPLAINT ──(has one)──> FEEDBACK (after RESOLVED)
COMPLAINT ──(has many)──> COMPLAINT_STATUS_HISTORY

NOTIFICATION ──(sent to)──> USER
```

### Key Entities

#### User
```java
User {
  UUID id
  String name
  Long phone
  String email (unique)
  String password  // @JsonIgnore — never exposed in API
  Role role        // STUDENT | WORKER | WARDEN | ADMIN | SUPER_ADMIN
  Hostel hostel    // ManyToOne — null for SUPER_ADMIN, optional for ADMIN
  Boolean isActive // soft-disable without deletion
  Instant createdAt, updatedAt
}
```

#### Complaint
```java
Complaint {
  UUID id
  User student       // ManyToOne — who filed it
  User assignedWorker// ManyToOne — nullable until assigned
  Hostel hostel      // ManyToOne — auto-inherited from student
  Category category  // ManyToOne
  String description // TEXT column
  String photoUrl    // Cloudinary URL, nullable
  Status status      // PENDING | ASSIGNED | IN_PROGRESS | RESOLVED | REJECTED
  Priority priority  // LOW | NORMAL | HIGH
  Integer escalationCount // reserved for future escalation feature
  Instant createdAt, updatedAt, resolvedAt
}
```

#### Hostel
```java
Hostel {
  UUID id
  String name
  String address
  User admin  // ManyToOne — the ADMIN who owns this hostel; null = unassigned
  Instant createdAt
}
```

#### ComplaintStatusHistory (Audit Log)
```java
ComplaintStatusHistory {
  UUID id
  Complaint complaint // ManyToOne
  Status oldStatus
  Status newStatus
  User changedBy      // ManyToOne
  Instant changedAt
}
```

#### Notification
```java
Notification {
  UUID id
  User recipient    // ManyToOne
  String title
  String message    // TEXT
  Boolean isRead    // default false
  UUID referenceId  // e.g., complaint UUID
  String referenceType  // e.g., "COMPLAINT"
  Instant createdAt
}
```

#### Feedback
```java
Feedback {
  UUID id
  Complaint complaint // OneToOne — unique constraint prevents duplicate feedback
  Integer rating      // 1–5
  String comment      // TEXT, nullable
  Instant createdAt
}
```

---

## 6. Security Architecture

### JWT Flow

```
┌──────────────┐    POST /api/auth/login     ┌──────────────────┐
│    Client    │ ──────────────────────────> │  AuthController  │
│              │ <── JWT Token ───────────── │                  │
└──────────────┘                             └──────────────────┘

┌──────────────┐  GET /api/student/... + Bearer <token>
│    Client    │ ──────────────────────────────────────>
│              │                             ┌──────────────────────┐
│              │                             │    JwtAuthFilter      │
│              │                             │  1. Extract token     │
│              │                             │  2. Validate (sig+exp)│
│              │                             │  3. Check blacklist   │
│              │                             │  4. Load User entity  │
│              │                             │  5. Set SecurityContext│
│              │                             └──────────┬───────────┘
│              │                                        │
│              │                             ┌──────────▼───────────┐
│              │                             │   SecurityConfig      │
│              │                             │   Role check passes   │
│              │                             └──────────┬───────────┘
│              │ <── 200 Response ──────────────────────┘
└──────────────┘
```

### JWT Token Structure
```json
{
  "sub": "user@email.com",
  "userId": "uuid-string",
  "role": "STUDENT",
  "iat": 1720000000,
  "exp": 1720086400
}
```
Signed with HMAC-SHA using the `jwt.secret` env var.

### Token Blacklisting (Logout)
Tokens are stored in `TokenBlacklistService` after logout, keyed by token string with TTL = natural expiry time. This handles the stateless JWT limitation where tokens can't be server-side invalidated otherwise.

### Security Config URL Rules (in priority order)
```
/api/auth/login        → permitAll
/api/auth/logout       → permitAll
/api/auth/me           → authenticated
/actuator/health       → permitAll
/v3/api-docs/**        → permitAll  (Swagger)
/api/superadmin/**     → hasRole(SUPER_ADMIN)
/api/admin/**          → hasAnyRole(ADMIN, SUPER_ADMIN)
/api/dashboard/**      → hasAnyRole(SUPER_ADMIN, ADMIN, WARDEN)
/api/warden/**         → hasRole(WARDEN)
/api/worker/**         → hasRole(WORKER)
/api/student/**        → hasRole(STUDENT)
/api/notifications/**  → authenticated
anyRequest             → authenticated
```

> **Note:** Spring Security prefixes roles with `ROLE_` internally. The `hasRole("STUDENT")` call actually checks for `ROLE_STUDENT`. The JWT `role` claim stores the raw enum name (`STUDENT`), and `JwtAuthFilter` adds the `ROLE_` prefix when building the `GrantedAuthority`.

---

## 7. Service Layer Patterns

### Interface + Implementation Pattern
All services follow the interface-implementation pattern:
```
ComplaintService (interface) → ComplaintServiceImpl (implementation)
```

**Benefits:**
- Easy to mock in tests (`@MockBean ComplaintService`)
- Loose coupling — controllers depend on interfaces, not concrete classes
- Supports future proxy injection (AOP, caching, etc.)

### Transaction Management
Mutations use `@Transactional` to ensure atomicity:
```java
@Transactional
public ComplaintResponse assignWorker(...) {
  // 1. Update complaint
  // 2. Save history record
  // 3. Send notifications
  // All or nothing
}
```

Read-only queries are generally not annotated (Hibernate uses auto-commit per query).

### Scope Enforcement Pattern
Every service method that deals with multi-tenant data enforces scope:

```java
// Warden scope check (hostel-level):
if (warden.getHostel() == null ||
    !complaint.getHostel().getId().equals(warden.getHostel().getId())) {
  throw new RuntimeException("You can only manage complaints in your hostel");
}

// Admin scope (hostelIds list):
List<UUID> hostelIds = hostelService.getScopedHostelIds(currentUser);
// Then use in JPA queries
```

### Notification Side-Effects
Notifications are sent as **synchronous side effects** within the same transaction. This keeps the implementation simple but means a notification send failure would roll back the main operation. A production improvement would be to publish to a message queue (e.g., RabbitMQ/Kafka) instead.

---

## 8. Repository Layer

Spring Data JPA repositories extend `JpaRepository<Entity, UUID>` and `JpaSpecificationExecutor<Entity>` where filtering is needed.

### Custom Queries
Repositories use JPQL and derived method names:
```java
// Derived method name:
List<User> findByHostelIdAndRole(UUID hostelId, User.Role role, Pageable pageable);

// Count queries:
long countByStudentIdAndStatus(UUID studentId, Complaint.Status status);
long countByHostelIdAndStatus(UUID hostelId, Complaint.Status status);
```

### ComplaintSpecification (JPA Criteria API)
The `ComplaintSpecification` class provides dynamic filtering without N+1 issues:

```java
ComplaintSpecification.withFilters(
  UUID studentId,    // filter by student
  UUID hostelId,     // filter by hostel
  UUID workerId,     // filter by assigned worker
  Status status,     // filter by status
  Priority priority, // filter by priority
  UUID categoryId    // filter by category
) → Specification<Complaint>
```

Each non-null parameter adds a `Predicate` to the JPA `CriteriaBuilder`. This allows a single `findAll(spec, pageable)` call for all roles with different filtering needs.

---

## 9. DTO Layer

### Why DTOs?

1. **Security** — JPA entities might expose internal fields (e.g., `password`, `admin` object with sensitive data).
2. **Decoupling** — Entity model can change without breaking the API contract.
3. **Shaping** — Responses can flatten nested entities (e.g., `hostelName` instead of `hostel.name`).

### Response flattening example (ComplaintResponse):
```java
// Entity has:
complaint.getHostel().getId()    // nested object
complaint.getHostel().getName()

// DTO flattens to:
ComplaintResponse.hostelId       // UUID
ComplaintResponse.hostelName     // String
```

### PagedResponse\<T\>
Generic wrapper for all paginated lists:
```java
PagedResponse<T> {
  List<T> content
  int page
  int size
  long totalElements
  int totalPages
  boolean last
}
```

Used by: complaints, users, hostels, notifications.

### Request Validation
Request DTOs use Jakarta Bean Validation annotations:
```java
@NotBlank String name
@Email String email
@NotNull UUID categoryId
@Min(1) @Max(5) Integer rating
```

`@Valid` in the controller triggers validation. Errors are caught by `GlobalExceptionHandler`.

---

## 10. Notification System

### Architecture
Notifications are **synchronous, database-backed push messages**. There is no WebSocket or SSE — clients poll `GET /api/notifications`.

### Internal API
```java
notificationService.notify(
  User recipient,
  String title,
  String message,
  UUID referenceId,    // e.g., complaint UUID
  String referenceType // e.g., "COMPLAINT"
)
```

Called internally within `ComplaintServiceImpl` after every status-changing operation.

### Notification lifecycle
```
Created (isRead=false) → Marked read (isRead=true) → Deleted
```

The `referenceId` + `referenceType` fields allow the frontend to deep-link to the relevant complaint when a notification is clicked.

---

## 11. File Storage (Cloudinary)

### Flow
```
Student uploads photo (multipart/form-data)
  → StudentController receives MultipartFile
  → cloudinaryService.upload(photo)
       → Cloudinary Java SDK API call
       → returns URL string (e.g., https://res.cloudinary.com/...)
  → URL stored in complaint.photoUrl
```

### Cleanup
Old photos are explicitly deleted when:
- A student **updates** a complaint with a new photo: `cloudinaryService.delete(oldUrl)`
- A student **cancels** a complaint: `cloudinaryService.delete(photoUrl)`

This prevents orphaned media assets accumulating in the Cloudinary account.

### Configuration
`Cloudinaryconfig.java` reads `CLOUDINARY_URL` env var and builds the Cloudinary SDK singleton bean.

---

## 12. Database & Migrations

### Schema Overview (6 main tables)

| Table | Description |
|---|---|
| `users` | All users across all roles; FK to `hostels` |
| `hostels` | Hostel entities; FK to `users` (admin) |
| `complaints` | Complaints; FK to `users` (student, worker), `hostels`, `categories` |
| `categories` | Complaint categories (platform-level) |
| `feedback` | One-to-one with complaints; rating + comment |
| `notifications` | Per-user notifications; FK to `users` |
| `complaint_status_history` | Audit log; FK to `complaints`, `users` |

### UUID Primary Keys
All entities use `UUID` as PK with `@GeneratedValue` (PostgreSQL `gen_random_uuid()`). Benefits:
- Globally unique — safe for distributed systems and external references.
- Non-sequential — prevents enumeration attacks.
- No ID collision when merging data from multiple sources.

### Flyway Migrations
Migration scripts in `src/main/resources/db/migration/`:
```
V1__init.sql         ← creates base tables
V2__add_indexes.sql  ← performance indexes
V3__add_escalation.sql ← escalationCount column
...
```

Flyway runs **before** the application starts serving requests. If a migration fails, the app won't start.

---

## 13. Configuration & Bootstrap

### Environment Variables

| Variable | Purpose |
|---|---|
| `spring.datasource.url` | JDBC URL for PostgreSQL |
| `spring.datasource.username` | DB username |
| `spring.datasource.password` | DB password |
| `jwt.secret` | HMAC-SHA signing key (≥256 bits recommended) |
| `jwt.expiration` | Token lifetime in milliseconds |
| `CLOUDINARY_URL` | Cloudinary connection string |
| `ADMIN_DEFAULT_PASSWORD` | Bootstrap admin password |
| `SUPER_ADMIN_DEFAULT_PASSWORD` | Bootstrap super admin password |
| `cors.allowed-origins` | Comma-separated allowed origins (default: `http://localhost:3000`) |

### DataInitializer (Bootstrap)
`DataInitializer implements CommandLineRunner` runs at every startup:
1. Creates (or resets password of) `admin@hocom.com` (ADMIN role).
2. Creates (or resets password of) `superadmin@hostelfixit.com` (SUPER_ADMIN role).
3. Seeds 8 default categories if they don't exist.

> ⚠️ The password reset on every startup means changing passwords via the API is **overwritten on next restart** unless the env vars are updated.

---

## 14. Error Handling

### GlobalExceptionHandler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(RuntimeException.class)
  → 400 Bad Request { "message": "..." }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  → 400 Bad Request { "errors": { "field": "message", ... } }
}
```

Spring Security handles:
- **401 Unauthorized** — no/invalid JWT token.
- **403 Forbidden** — valid token but insufficient role.

Both are configured inline in `SecurityConfig.exceptionHandling()`.

### Error Pattern
All business rule violations are thrown as `RuntimeException` and caught globally. A production improvement would be to define a hierarchy of custom exceptions (e.g., `ResourceNotFoundException`, `PermissionDeniedException`) to allow more precise HTTP status codes (e.g., 404, 403).

---

## 15. CORS & API Docs

### CORS
Configured in `SecurityConfig.corsConfigurationSource()`:
- Allowed origins: comma-separated list from `cors.allowed-origins` env var.
- Allowed methods: `GET, POST, PUT, DELETE, OPTIONS`.
- Allowed headers: `Authorization, Content-Type`.
- Credentials: `true` (needed for cookie-based auth if added in future).

### OpenAPI / Swagger UI
Available at:
- `GET /v3/api-docs` — OpenAPI JSON spec
- `GET /swagger-ui.html` — Interactive Swagger UI

All these routes are `permitAll` in `SecurityConfig`. Metadata configured in `OpenApiConfig.java`.

### Actuator
`GET /actuator/health` is `permitAll` — used by load balancers and health checks without authentication.

---

## 16. Request Flow Diagram

### Full flow: Student files a complaint with photo

```
1. Client sends:
   POST /api/student/complaints
   Authorization: Bearer <jwt>
   Content-Type: multipart/form-data
   Body: { categoryId, description, priority, photo }

2. JwtAuthFilter:
   - Validates JWT signature & expiry
   - Checks token not blacklisted
   - Loads User entity from DB
   - Sets SecurityContext

3. SecurityConfig:
   - /api/student/** → hasRole(STUDENT) → PASS

4. StudentController.createComplaint():
   - Extracts @AuthenticationPrincipal User currentUser
   - Calls cloudinaryService.upload(photo) → photoUrl
   - Builds CreateComplaintRequest
   - Delegates to complaintService.createComplaint(request, currentUser)

5. ComplaintServiceImpl.createComplaint():
   - Validates student.role == STUDENT
   - Validates student.hostel != null
   - Fetches Category from categoryRepository
   - Builds Complaint entity (status=PENDING, hostel from student)
   - Saves to complaintRepository
   - Fetches all wardens of the hostel (paginated query)
   - For each warden: notificationService.notify(...)
       → NotificationServiceImpl.notify()
           → saves Notification entity to DB

6. Returns ComplaintResponse (201 Created)
```

### Architecture Decision Log

| Decision | Choice | Reason |
|---|---|---|
| Stateless auth | JWT | No session storage needed; scales horizontally |
| ORM | Hibernate/JPA | Standard, integrates with Spring Data |
| DB migrations | Flyway | Reproducible, version-controlled schema changes |
| Photo storage | Cloudinary | No self-hosted storage; CDN delivery |
| Role model | Flat enum (5 roles) | Simple; role hierarchy enforced at URL and service level |
| Notifications | Sync + DB poll | Simple to implement; no WebSocket complexity |
| Error handling | Global @ControllerAdvice | Centralized; avoids try-catch in every controller |
| Pagination | Spring Pageable + PagedResponse | Standard Spring pattern |
| Dynamic filtering | JPA Specification | Type-safe, composable predicates without N+1 |
