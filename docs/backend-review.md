# HostelFixIT — Backend Review

> **Last reviewed:** 22 March 2026

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Spring Boot **4.0.2**, Java 17 |
| Auth | Spring Security + JWT (HS512, 24 h expiry, token blacklisting) |
| Database | PostgreSQL via Spring Data JPA (`ddl-auto=update`) |
| File uploads | Cloudinary (`cloudinary-http44`) |
| Validation | Jakarta Bean Validation |
| Boilerplate | Lombok |

---

## What's Been Done ✅

### 1. Data Model (6 entities)

| Entity | Table | Key Fields |
|---|---|---|
| `User` | `users` | id, name, email, phone, password, role (STUDENT/WORKER/WARDEN/ADMIN), hostel, isActive |
| `Hostel` | `hostels` | id, name, address |
| `Category` | `categories` | id, name, description (unique name) |
| `Complaint` | `complaints` | id, student, assignedWorker, hostel, category, description, photoUrl, status, priority, createdAt/updatedAt/resolvedAt |
| `Feedback` | `feedback` | id, complaint (1:1), rating, comment |
| `ComplaintStatusHistory` | `complaint_status_history` | id, complaint, oldStatus, newStatus, changedBy, changedAt |

### 2. Authentication & Security

- [x] JWT login (`POST /api/auth/login`) — returns token + user info
- [x] JWT logout with server-side token blacklisting (`POST /api/auth/logout`)
- [x] `JwtAuthFilter` validates token on every request
- [x] Stateless sessions (no cookies)
- [x] Role-based endpoint security:
  - `/api/admin/**` — ADMIN only
  - `/api/dashboard/**` — ADMIN + WARDEN
  - `/api/warden/**` — WARDEN only
  - `/api/student/**` — STUDENT only
  - `/api/worker/**` — WORKER only
- [x] CORS configured from env (`CORS_ORIGINS`)
- [x] `GlobalExceptionHandler` with safe-message whitelist (no stack traces leaked)

### 3. Admin Endpoints (`/api/admin`)

- [x] **Users**: CRUD — create, list (paginated), get by ID, get by role, update, delete
- [x] **Hostels**: CRUD — create, list, get by ID, update, delete
- [x] **Hostels → Users**: list wardens/students/workers per hostel
- [x] **Categories**: CRUD — create, list, get by ID, update, delete
- [x] **Complaints**: list all (filtered by status, priority, hostelId + sorting + pagination), get by ID
- [x] **Feedback**: view feedback on any complaint
- [x] **Status History**: view full status-change timeline for any complaint

### 4. Warden Endpoints (`/api/warden`)

- [x] Create STUDENT/WORKER users (auto-scoped to warden's hostel)
- [x] List students / workers in own hostel
- [x] View / update / delete users in own hostel
- [x] View complaints in own hostel (filtered + paginated)
- [x] **Assign** worker to complaint
- [x] **Reject** complaint
- [x] View feedback and status history per complaint

### 5. Student Endpoints (`/api/student`)

- [x] View / update own profile
- [x] List categories (for complaint form)
- [x] **Create** complaint with optional photo upload (multipart)
- [x] **List** own complaints (filtered + paginated)
- [x] **Update** own complaint (only while PENDING)
- [x] **Cancel** own complaint (only while PENDING)
- [x] **Submit** feedback on RESOLVED/REJECTED complaints (rating + comment)
- [x] View feedback for own complaints

### 6. Worker Endpoints (`/api/worker`)

- [x] View / update own profile
- [x] List assigned complaints (filtered + paginated)
- [x] **Start progress** (ASSIGNED → IN_PROGRESS)
- [x] **Resolve** complaint (IN_PROGRESS → RESOLVED)
- [x] View feedback on assigned complaints

### 7. Dashboard (`/api/dashboard/stats`)

- [x] **Admin** view: total complaints (by status), total users (by role), total hostels, categories, feedbacks, avg rating
- [x] **Warden** view: same stats but scoped to their hostel

### 8. In-App Notifications

- [x] `Notification` entity with recipient, title, message, referenceId, isRead
- [x] Notifications triggered on: complaint created (→ wardens), assigned (→ student + worker), in-progress (→ student), resolved (→ student), rejected (→ student)
- [x] Shared `/api/notifications` controller: list, unread count, mark read, mark all read
- [x] Accessible by all authenticated users

### 9. Infrastructure

- [x] `DataInitializer`: seeds default ADMIN (`admin@hocom.com / 123`) + 8 default categories
- [x] Cloudinary service for image uploads
- [x] Pagination DTO (`PagedResponse`) for all list endpoints
- [x] `ComplaintSpecification` for dynamic filtering via JPA Specifications
- [x] `.env`-driven configuration (DB, JWT secret, Cloudinary, CORS)

---

## What's Left / Can Be Improved 🔲

### High Priority

- [ ] **No registration endpoint** — users can only be created by ADMIN or WARDEN. If self-registration is needed (e.g., students signing up), a `POST /api/auth/register` endpoint is missing.
- [ ] **No password-reset / forgot-password flow** — no endpoint to reset passwords via email.
- [x] ~~**No email/notification service**~~ — in-app notifications now implemented. Email notifications remain as a future enhancement.
- [ ] **Tests are missing** — only a default `HoComApplicationTests` placeholder exists. No unit or integration tests.
- [x] ~~**`ddl-auto=update` in production is risky**~~ — switched to Flyway migrations with `ddl-auto=validate`. See [flyway-guide.md](file:///Users/blue/Documents/HostelFixIT/docs/flyway-guide.md).

### Medium Priority

- [ ] **Escalation feature** — commented out in `Complaint.java` (`escalationCount`). Not implemented.
- [ ] **No student dashboard stats** — only Admin and Warden have dashboard stats; students/workers have no stats endpoint.
- [ ] **Hardcoded admin credentials** — `DataInitializer` uses `password: 123`. Should use env var for production.
- [ ] **No rate limiting** — no protection against brute-force login attempts.
- [ ] **No API documentation** — no Swagger/OpenAPI spec. Would make frontend integration easier.
- [ ] **No refresh-token flow** — JWT has 24h expiry with no refresh; user must re-login.

### Low Priority / Nice-to-Have

- [ ] **Complaint images: no deletion** — changing a photo uploads a new one but the old Cloudinary image isn't cleaned up.
- [ ] **No search** — no text-search on complaints (by description/keyword).
- [ ] **No bulk operations** — e.g., assign multiple complaints to a worker at once.
- [ ] **No audit log beyond status history** — user edits, hostel changes, etc. are not logged.
- [ ] **Room number / floor** — the Hostel entity is basic (name + address only). No room/floor tracking.
- [ ] **No Dockerization** — README mentions Docker but there's no `Dockerfile` or `docker-compose.yml`.

---

## File Inventory

```
backend/src/main/java/com/HoCom/backend/
├── Config/
│   ├── Cloudinaryconfig.java
│   ├── DataInitializer.java
│   ├── GlobalExceptionHandler.java
│   ├── JwtAuthFilter.java
│   ├── JwtUtil.java
│   └── SecurityConfig.java
├── controller/
│   ├── AdminController.java       (254 lines)
│   ├── AuthController.java        (44 lines)
│   ├── DashboardController.java   (33 lines)
│   ├── StudentController.java     (164 lines)
│   ├── WardenController.java      (182 lines)
│   ├── WorkerController.java      (93 lines)
│   └── NotificationController.java (53 lines)
├── dto/                           (20 DTOs)
├── models/
│   ├── Category.java
│   ├── Complaint.java
│   ├── ComplaintStatusHistory.java
│   ├── Feedback.java
│   ├── Hostel.java
│   └── User.java
├── repositories/                  (7 repos + ComplaintSpecification)
├── service/                       (9 interfaces + 9 impls)
└── HoComApplication.java
```

---

## API Endpoint Summary

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login, returns JWT |
| POST | `/api/auth/logout` | Any | Blacklists current token |
| POST | `/api/admin/users` | ADMIN | Create any user |
| GET | `/api/admin/users` | ADMIN | List all users (paged) |
| GET | `/api/admin/users/{id}` | ADMIN | Get user by ID |
| GET | `/api/admin/users/role/{role}` | ADMIN | List users by role |
| PUT | `/api/admin/users/{id}` | ADMIN | Update user |
| DELETE | `/api/admin/users/{id}` | ADMIN | Delete user |
| POST | `/api/admin/hostels` | ADMIN | Create hostel |
| GET | `/api/admin/hostels` | ADMIN | List all hostels |
| GET | `/api/admin/hostels/{id}` | ADMIN | Get hostel by ID |
| GET | `/api/admin/hostels/{id}/wardens` | ADMIN | List wardens in hostel |
| GET | `/api/admin/hostels/{id}/students` | ADMIN | List students in hostel |
| GET | `/api/admin/hostels/{id}/workers` | ADMIN | List workers in hostel |
| PUT | `/api/admin/hostels/{id}` | ADMIN | Update hostel |
| DELETE | `/api/admin/hostels/{id}` | ADMIN | Delete hostel |
| POST | `/api/admin/categories` | ADMIN | Create category |
| GET | `/api/admin/categories` | ADMIN | List categories |
| GET | `/api/admin/categories/{id}` | ADMIN | Get category by ID |
| PUT | `/api/admin/categories/{id}` | ADMIN | Update category |
| DELETE | `/api/admin/categories/{id}` | ADMIN | Delete category |
| GET | `/api/admin/complaints` | ADMIN | List all complaints (filters) |
| GET | `/api/admin/complaints/{id}` | ADMIN | Get complaint detail |
| GET | `/api/admin/complaints/{id}/feedback` | ADMIN | View feedback |
| GET | `/api/admin/complaints/{id}/history` | ADMIN | Status change timeline |
| GET | `/api/dashboard/stats` | ADMIN, WARDEN | Dashboard statistics |
| POST | `/api/warden/users` | WARDEN | Create student/worker |
| GET | `/api/warden/students` | WARDEN | List hostel students |
| GET | `/api/warden/workers` | WARDEN | List hostel workers |
| GET | `/api/warden/users/{id}` | WARDEN | Get user in hostel |
| PUT | `/api/warden/users/{id}` | WARDEN | Update user |
| DELETE | `/api/warden/users/{id}` | WARDEN | Delete user |
| GET | `/api/warden/complaints` | WARDEN | List hostel complaints |
| GET | `/api/warden/complaints/{id}` | WARDEN | Get complaint detail |
| PUT | `/api/warden/complaints/{id}/assign` | WARDEN | Assign worker |
| PUT | `/api/warden/complaints/{id}/reject` | WARDEN | Reject complaint |
| GET | `/api/warden/complaints/{id}/feedback` | WARDEN | View feedback |
| GET | `/api/warden/complaints/{id}/history` | WARDEN | Status history |
| GET | `/api/student/profile` | STUDENT | View own profile |
| PUT | `/api/student/profile` | STUDENT | Update own profile |
| GET | `/api/student/categories` | STUDENT | List categories |
| POST | `/api/student/complaints` | STUDENT | File complaint (multipart) |
| GET | `/api/student/complaints` | STUDENT | List own complaints |
| GET | `/api/student/complaints/{id}` | STUDENT | Get own complaint |
| PUT | `/api/student/complaints/{id}` | STUDENT | Update own complaint |
| DELETE | `/api/student/complaints/{id}` | STUDENT | Cancel own complaint |
| POST | `/api/student/feedback` | STUDENT | Submit feedback |
| GET | `/api/student/complaints/{id}/feedback` | STUDENT | View own feedback |
| GET | `/api/worker/profile` | WORKER | View own profile |
| PUT | `/api/worker/profile` | WORKER | Update own profile |
| GET | `/api/worker/complaints` | WORKER | List assigned complaints |
| GET | `/api/worker/complaints/{id}` | WORKER | Get assigned complaint |
| PUT | `/api/worker/complaints/{id}/in-progress` | WORKER | Start work |
| PUT | `/api/worker/complaints/{id}/resolve` | WORKER | Mark resolved |
| GET | `/api/worker/complaints/{id}/feedback` | WORKER | View feedback |
| GET | `/api/notifications` | Any auth | List notifications (paged) |
| GET | `/api/notifications/unread-count` | Any auth | Get unread count |
| PUT | `/api/notifications/{id}/read` | Any auth | Mark one as read |
| PUT | `/api/notifications/read-all` | Any auth | Mark all as read |
