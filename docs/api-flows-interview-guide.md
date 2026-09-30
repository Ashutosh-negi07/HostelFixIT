# HostelFixIT — API Flows Interview Guide

> **Purpose:** A comprehensive Q&A reference for interview preparation covering every API flow in the HostelFixIT backend. Use this to articulate how requests travel from the HTTP layer down to the database.

---

## Table of Contents

1. [Authentication Flows](#1-authentication-flows)
2. [Complaint Lifecycle Flows](#2-complaint-lifecycle-flows)
3. [User Management Flows](#3-user-management-flows)
4. [Hostel Management Flows](#4-hostel-management-flows)
5. [Category Management Flows](#5-category-management-flows)
6. [Notification Flows](#6-notification-flows)
7. [Feedback Flows](#7-feedback-flows)
8. [Dashboard & Stats Flows](#8-dashboard--stats-flows)
9. [Role-Based Access Control (RBAC)](#9-role-based-access-control-rbac)
10. [Cross-Cutting Concerns](#10-cross-cutting-concerns)

---

## 1. Authentication Flows

### Q: Walk me through the login flow end-to-end.

**Flow:** `POST /api/auth/login`

```
Client → POST /api/auth/login { email, password }
       → JwtAuthFilter (skips — route is permitAll)
       → AuthController.login()
       → AuthServiceImpl.login()
           ├── userRepository.findByEmail(email)       // throws if not found
           ├── passwordEncoder.matches(raw, hashed)    // BCrypt comparison
           ├── checks user.isActive                    // throws if deactivated
           └── jwtUtil.generateToken(userId, email, role)
                   // JWT claims: sub=email, userId=UUID, role=ROLE_NAME
                   // signed with HMAC-SHA key, expiry from jwt.expiration env var
       → returns AuthResponse { token, userId, name, email, role, message }
```

**Key points to mention:**
- Passwords are hashed with **BCrypt** (`BCryptPasswordEncoder`).
- The JWT carries `userId`, `email`, and `role` as claims.
- A deactivated account (`isActive = false`) gets a `RuntimeException` before a token is issued.
- The `JwtAuthFilter` is configured to skip `/api/auth/login` — no chicken-and-egg problem.

---

### Q: How does JWT validation work on protected routes?

**Flow:** `GET /api/student/complaints` (any protected endpoint)

```
Client → GET /api/student/complaints
       → JwtAuthFilter (extends OncePerRequestFilter)
           ├── reads "Authorization: Bearer <token>" header
           ├── jwtUtil.isTokenValid(token)       // checks signature + expiry
           ├── tokenBlacklistService.isBlacklisted(token)  // Redis/in-memory set
           ├── jwtUtil.extractEmail(token)
           ├── userRepository.findByEmail(email) // loads full User entity
           └── sets SecurityContextHolder with UsernamePasswordAuthenticationToken
       → SecurityConfig authorizeHttpRequests
           └── /api/student/** → hasRole("STUDENT")
       → StudentController method runs with @AuthenticationPrincipal User currentUser
```

**Key points:**
- The filter runs **before** `UsernamePasswordAuthenticationFilter`.
- `@AuthenticationPrincipal User currentUser` extracts the `User` entity injected into `SecurityContext`.
- Blacklisted tokens (from logout) are rejected even if they haven't expired.

---

### Q: Explain the logout flow.

**Flow:** `POST /api/auth/logout`

```
Client → POST /api/auth/logout (Authorization: Bearer <token>)
       → AuthController.logout()
           ├── extracts token from header
           ├── jwtUtil.isTokenValid(token)
           ├── extracts expiry: jwtUtil.extractAllClaims(token).getExpiration().getTime()
           └── tokenBlacklistService.blacklist(token, expiryMs)
                   // stores token until its natural expiry so it can't be reused
       → returns { message: "Logged out successfully" }
```

**Why store until natural expiry?** The token is still cryptographically valid; the blacklist is the only way to invalidate it server-side.

---

### Q: How does user creation work? Who can create whom?

**Flow:** `POST /api/admin/users` or `POST /api/warden/users` or `POST /api/superadmin/admins`

```
Client → POST /api/admin/users { name, email, password, role, hostelId }
       → AdminController.createUser()
       → AuthServiceImpl.createUser(request, currentUser)
           ├── Role permission matrix check:
           │     SUPER_ADMIN  → can create ADMIN, WARDEN, WORKER, STUDENT
           │     ADMIN        → can create WARDEN, WORKER, STUDENT (not ADMIN/SUPER_ADMIN)
           │     WARDEN       → can create STUDENT, WORKER only
           ├── userRepository.existsByEmail(email) → throws if duplicate
           ├── hostelRepository.findById(hostelId) → resolves hostel
           ├── Wardens are auto-scoped to their own hostel
           └── userRepository.save(newUser)  // password BCrypt-encoded
       → returns AuthResponse (no token — admin creates accounts, not logging in)
```

---

## 2. Complaint Lifecycle Flows

### Q: Walk me through the full complaint lifecycle.

**Status State Machine:**

```
PENDING → ASSIGNED → IN_PROGRESS → RESOLVED
PENDING → REJECTED
ASSIGNED → REJECTED
IN_PROGRESS → REJECTED
ASSIGNED → ASSIGNED (reassign worker)
```

---

### Q: How does a student file a complaint?

**Flow:** `POST /api/student/complaints` (multipart/form-data)

```
Client → POST /api/student/complaints
         { categoryId, description, priority?, photo? }
       → StudentController.createComplaint()
           ├── if photo present: cloudinaryService.upload(photo) → photoUrl
           ├── builds CreateComplaintRequest
           └── complaintService.createComplaint(request, currentUser)
               → ComplaintServiceImpl.createComplaint()
                   ├── validates student.role == STUDENT
                   ├── validates student.hostel != null
                   ├── categoryRepository.findById(categoryId)
                   ├── Complaint.builder()
                   │     .student(student)
                   │     .hostel(student.hostel)   // inherited from student
                   │     .category(category)
                   │     .status(PENDING)           // default
                   │     .priority(priority)
                   │     .build()
                   ├── complaintRepository.save(complaint)
                   └── notificationService.notify(each warden in hostel, ...)
       → returns ComplaintResponse (201 Created)
```

**Key points:**
- Complaint hostel is **auto-derived** from the student's hostel — student cannot pick a different hostel.
- Photo is uploaded to **Cloudinary** before saving; only the URL is stored.
- Wardens of the hostel are notified automatically.

---

### Q: How does a warden assign a worker?

**Flow:** `PUT /api/warden/complaints/{complaintId}/assign { workerId }`

```
ComplaintServiceImpl.assignWorker(complaintId, workerId, warden)
  ├── fetch complaint
  ├── validates warden.hostel == complaint.hostel  // scope enforcement
  ├── validates worker.role == WORKER
  ├── complaint.setAssignedWorker(worker)
  ├── complaint.setStatus(ASSIGNED)
  ├── complaintRepository.save(complaint)
  ├── recordStatusChange(PENDING → ASSIGNED, changedBy=warden)
  ├── notify student: "Your complaint has been assigned to {worker}"
  └── notify worker:  "You have been assigned a new complaint: {desc}"
```

---

### Q: How does the worker start work and resolve a complaint?

**Start work — `PUT /api/worker/complaints/{id}/in-progress`**

```
ComplaintServiceImpl.startProgress()
  ├── validates complaint.assignedWorker == currentWorker
  ├── validates complaint.status == ASSIGNED
  ├── complaint.setStatus(IN_PROGRESS)
  ├── recordStatusChange(ASSIGNED → IN_PROGRESS, changedBy=worker)
  └── notify student: "Work has started on your complaint"
```

**Resolve — `PUT /api/worker/complaints/{id}/resolve`**

```
ComplaintServiceImpl.resolveComplaint()
  ├── validates complaint.assignedWorker == currentWorker
  ├── validates status not already RESOLVED/REJECTED
  ├── complaint.setStatus(RESOLVED)
  ├── complaint.setResolvedAt(Instant.now())
  ├── recordStatusChange(IN_PROGRESS → RESOLVED, changedBy=worker)
  └── notify student: "Complaint Resolved. Please provide feedback!"
```

---

### Q: How does complaint rejection work?

**Flow:** `PUT /api/warden/complaints/{id}/reject`

```
ComplaintServiceImpl.rejectComplaint()
  ├── validates warden.hostel == complaint.hostel
  ├── complaint.setStatus(REJECTED)
  ├── recordStatusChange(oldStatus → REJECTED, changedBy=warden)
  └── notify student: "Your complaint has been rejected by the warden"
```

Rejection can happen from PENDING, ASSIGNED, or IN_PROGRESS — any non-terminal state.

---

### Q: How does worker reassignment work?

**Flow:** `PUT /api/warden/complaints/{id}/reassign { workerId }`

```
ComplaintServiceImpl.reassignWorker()
  ├── validates warden scope
  ├── validates status == ASSIGNED or IN_PROGRESS
  ├── complaint.setAssignedWorker(newWorker)
  ├── complaint.setStatus(ASSIGNED)  // resets to ASSIGNED
  ├── notify old worker:  "Assignment Removed"
  ├── notify student:     "Complaint Reassigned to {newWorker}"
  └── notify new worker:  "New Assignment: {desc}"
```

---

### Q: How does a student update or cancel a complaint?

**Update — `PUT /api/student/complaints/{id}` (multipart)**

```
ComplaintServiceImpl.updateComplaint()
  ├── validates complaint.student == currentStudent
  ├── validates complaint.status == PENDING  // PENDING only
  ├── updates description, priority, category if provided
  ├── if new photo: cloudinaryService.delete(oldUrl) then upload new
  └── complaintRepository.save(complaint)
```

**Cancel — `DELETE /api/student/complaints/{id}`**

```
ComplaintServiceImpl.cancelComplaint()
  ├── validates complaint.student == currentStudent
  ├── validates complaint.status == PENDING
  ├── cloudinaryService.delete(photoUrl)  // cleanup
  └── complaintRepository.delete(complaint)
```

---

### Q: How does the complaint status history (audit trail) work?

Every status transition records a `ComplaintStatusHistory` entry:

```
ComplaintStatusHistory { id, complaint, oldStatus, newStatus, changedBy, changedAt }
```

Accessible via `GET /api/admin/complaints/{id}/history` and `GET /api/warden/complaints/{id}/history`. The history is **append-only** — full audit trail.

---

### Q: How does complaint filtering and pagination work?

All list endpoints accept: `status`, `priority`, `categoryId`, `sortBy`, `order`, `page`, `size`.

```
ComplaintSpecification.withFilters(studentId?, hostelId?, workerId?, status?, priority?, categoryId?)
  → builds JPA Specification (Criteria API predicates)
  → complaintRepository.findAll(spec, pageable)
  → returns PagedResponse<ComplaintResponse>
```

Scoping per role:
- **Student** → filtered by `studentId`
- **Warden** → filtered by `hostelId` (their own hostel)
- **Worker** → filtered by `assignedWorkerId`
- **Admin** → can filter by any `hostelId`

---

## 3. User Management Flows

### Q: How do profile updates work? What can each role change?

```
StudentController.updateProfile():
  // Builds a SAFE request stripping role, hostelId, isActive
  safeRequest = { name, phone, oldPassword, password }
  → userService.updateUser(currentUser.getId(), safeRequest, currentUser)
```

Admins can update other users via `PUT /api/admin/users/{userId}` (full fields).

Wardens explicitly null out restricted fields before delegating:
```java
request.setRole(null);
request.setHostelId(null);
```

---

### Q: How does toggle-active (enable/disable) work?

**Flow:** `PUT /api/admin/users/{userId}/toggle-active`

```
UserServiceImpl.toggleActive()
  ├── fetch user
  ├── user.setIsActive(!user.getIsActive())
  └── userRepository.save(user)
```

A disabled user cannot log in — `AuthServiceImpl.login()` checks `isActive` before issuing a token.

---

## 4. Hostel Management Flows

### Q: How is a hostel created and assigned?

**SUPER_ADMIN creates unassigned hostel:**
```
POST /api/superadmin/hostels
  → hostelService.createHostel(request, null)  // admin=null
```

**Assign hostel to admin:**
```
PUT /api/superadmin/hostels/{hostelId}/assign { adminId }
  → hostel.setAdmin(adminUser) → hostelRepository.save(hostel)
```

**ADMIN creates hostel (auto-assigned to themselves):**
```
POST /api/admin/hostels
  → hostelService.createHostel(request, currentUser)  // admin=currentAdmin
```

---

### Q: How does hostel scoping work?

```java
hostelService.getScopedHostelIds(currentUser):
  if SUPER_ADMIN → returns ALL hostel IDs
  if ADMIN       → returns only hostels where admin_id == currentUser.id
```

Applied before any user/hostel query by ADMINs.

---

## 5. Category Management Flows

Categories are **platform-level** (not hostel-scoped). Both ADMIN and SUPER_ADMIN can manage them.

**Default categories** seeded at startup by `DataInitializer`:
`Plumbing, Electrical, Cleaning, Furniture, Internet, Security, Maintenance, Other`

Students get a read-only list via `GET /api/student/categories` when filing a complaint.

---

## 6. Notification Flows

### Q: How are notifications triggered and delivered?

Notifications are created **internally** by `NotificationService.notify()`.

**Triggers:**

| Event | Recipients |
|---|---|
| Student files complaint | All wardens of that hostel |
| Warden assigns worker | Student + Worker |
| Warden reassigns worker | Old worker + Student + New worker |
| Worker starts progress | Student |
| Worker resolves complaint | Student |
| Warden rejects complaint | Student |

**Reading notifications:**
```
GET /api/notifications?page=0&size=20
  → notificationRepository.findByRecipientOrderByCreatedAtDesc(user, pageable)

GET /api/notifications/unread-count
  → notificationRepository.countByRecipientAndIsRead(user, false)
```

**Marking as read:**
```
PUT /api/notifications/{id}/read
  → validates notification.recipient == currentUser
  → notification.setIsRead(true) → save

PUT /api/notifications/read-all
  → batch update: all unread for currentUser
```

---

## 7. Feedback Flows

### Q: How does the feedback system work?

Feedback is **one-per-complaint** (OneToOne). Students submit after resolution.

```
POST /api/student/feedback { complaintId, rating (1-5), comment? }
  → FeedbackServiceImpl.createFeedback()
      ├── fetch complaint
      ├── validates complaint.student == currentStudent
      ├── validates complaint.status == RESOLVED
      ├── checks no existing feedback (OneToOne)
      └── feedbackRepository.save(new Feedback)
  → 201 Created

GET /api/student/complaints/{id}/feedback  (also warden, admin, worker)
  → feedbackService.getFeedbackByComplaintId(id, currentUser)
  → validates access by role, returns FeedbackResponse
```

---

## 8. Dashboard & Stats Flows

### Q: How does the dashboard work?

**Flow:** `GET /api/dashboard/stats`

```
DashboardController.getDashboardStats()
  if ADMIN  → dashboardService.getAdminDashboardStats()
               // aggregated across all hostels for that admin
  if WARDEN → dashboardService.getWardenDashboardStats(currentUser)
               // scoped to warden's hostel only
```

**Super Admin global stats:** `GET /api/superadmin/stats`
```json
{
  "totalAdmins": N,
  "totalWardens": N,
  "totalWorkers": N,
  "totalStudents": N,
  "totalHostels": N,
  "totalUsers": N
}
```

**Complaint count endpoints:**
- `GET /api/student/complaints/count` → counts by status for the student
- `GET /api/warden/complaints/count` → counts by status for hostel
- `GET /api/worker/complaints/count` → counts for assigned complaints

---

## 9. Role-Based Access Control (RBAC)

### Q: How is RBAC enforced?

**Layer 1 — Spring Security URL matching:**
```java
.requestMatchers("/api/superadmin/**").hasRole("SUPER_ADMIN")
.requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
.requestMatchers("/api/warden/**").hasRole("WARDEN")
.requestMatchers("/api/worker/**").hasRole("WORKER")
.requestMatchers("/api/student/**").hasRole("STUDENT")
.requestMatchers("/api/dashboard/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "WARDEN")
.requestMatchers("/api/notifications/**").authenticated()
```

**Layer 2 — Service-level scope checks:**
```java
// Warden hostel scope:
if (!complaint.getHostel().getId().equals(warden.getHostel().getId()))
    throw new RuntimeException("...");

// Student own-resource check:
if (!complaint.getStudent().getId().equals(currentUser.getId()))
    throw new RuntimeException("...");
```

**Role hierarchy:**

| Role | Capabilities |
|---|---|
| `SUPER_ADMIN` | Global platform management; all hostels, all admins |
| `ADMIN` | Their hostels' users and complaints (scoped) |
| `WARDEN` | Their hostel's students, workers, complaints |
| `WORKER` | Only their assigned complaints |
| `STUDENT` | Only their own complaints and feedback |

---

## 10. Cross-Cutting Concerns

### Error Handling

`GlobalExceptionHandler` (`@RestControllerAdvice`) catches:
- `RuntimeException` → 400 Bad Request `{ message: "..." }`
- `MethodArgumentNotValidException` → 400 with field validation errors
- Spring Security exceptions → 401 Unauthorized / 403 Forbidden

### CORS

```java
allowedOrigins: [${cors.allowed-origins}]   // default: localhost:3000
allowedMethods: [GET, POST, PUT, DELETE, OPTIONS]
allowedHeaders: [Authorization, Content-Type]
allowCredentials: true
```

### Photo Storage (Cloudinary)

- `CloudinaryService.upload(MultipartFile)` → returns a URL string stored in `photo_url` column.
- On complaint update or cancel: `cloudinaryService.delete(photoUrl)` avoids orphaned assets.

### Database Migrations (Flyway)

Flyway (`flyway-core` + `flyway-database-postgresql`) manages schema migrations from `src/main/resources/db/migration/`. Runs automatically on startup.

### Escalation (Reserved)

`Complaint.escalationCount` field exists but is **commented out** in `mapToResponse()`. Reserved for a future feature to auto-escalate stale complaints.

### Bootstrap Data (DataInitializer)

`DataInitializer` (implements `CommandLineRunner`) runs on every startup:
- Creates/updates default ADMIN (`admin@hocom.com`) and SUPER_ADMIN (`superadmin@hostelfixit.com`).
- Always resets passwords from env vars `ADMIN_DEFAULT_PASSWORD` / `SUPER_ADMIN_DEFAULT_PASSWORD`.
- Seeds 8 default complaint categories if they don't exist.

---

## Quick Reference: All Endpoints

| Method | Path | Role | Action |
|--------|------|------|--------|
| `POST` | `/api/auth/login` | Public | Login |
| `POST` | `/api/auth/logout` | Any | Logout (blacklist token) |
| `GET` | `/api/auth/me` | Any | Get current user |
| `GET` | `/api/student/profile` | STUDENT | Get profile |
| `PUT` | `/api/student/profile` | STUDENT | Update profile |
| `GET` | `/api/student/categories` | STUDENT | List categories |
| `POST` | `/api/student/complaints` | STUDENT | File complaint |
| `GET` | `/api/student/complaints` | STUDENT | My complaints (paged) |
| `GET` | `/api/student/complaints/{id}` | STUDENT | Get complaint |
| `PUT` | `/api/student/complaints/{id}` | STUDENT | Update (PENDING only) |
| `DELETE` | `/api/student/complaints/{id}` | STUDENT | Cancel (PENDING only) |
| `GET` | `/api/student/complaints/count` | STUDENT | Counts by status |
| `POST` | `/api/student/feedback` | STUDENT | Submit feedback |
| `GET` | `/api/student/complaints/{id}/feedback` | STUDENT | Get feedback |
| `GET` | `/api/student/hostel` | STUDENT | Get my hostel |
| `GET` | `/api/worker/complaints` | WORKER | My assigned complaints |
| `PUT` | `/api/worker/complaints/{id}/in-progress` | WORKER | Start work |
| `PUT` | `/api/worker/complaints/{id}/resolve` | WORKER | Resolve complaint |
| `GET` | `/api/worker/complaints/count` | WORKER | Counts by status |
| `GET` | `/api/warden/complaints` | WARDEN | Hostel complaints |
| `PUT` | `/api/warden/complaints/{id}/assign` | WARDEN | Assign worker |
| `PUT` | `/api/warden/complaints/{id}/reassign` | WARDEN | Reassign worker |
| `PUT` | `/api/warden/complaints/{id}/reject` | WARDEN | Reject complaint |
| `GET` | `/api/warden/complaints/{id}/history` | WARDEN | Status history |
| `GET` | `/api/warden/students` | WARDEN | List students |
| `GET` | `/api/warden/workers` | WARDEN | List workers |
| `POST` | `/api/warden/users` | WARDEN | Create student/worker |
| `GET` | `/api/admin/complaints` | ADMIN | All complaints |
| `GET` | `/api/admin/users` | ADMIN | All users (scoped) |
| `POST` | `/api/admin/users` | ADMIN | Create user |
| `PUT` | `/api/admin/users/{id}/toggle-active` | ADMIN | Enable/disable user |
| `GET` | `/api/admin/hostels` | ADMIN | Scoped hostels |
| `POST` | `/api/admin/hostels` | ADMIN | Create hostel |
| `POST` | `/api/admin/categories` | ADMIN | Create category |
| `GET` | `/api/admin/complaints/{id}/history` | ADMIN | Status history |
| `GET` | `/api/dashboard/stats` | ADMIN/WARDEN | Dashboard stats |
| `POST` | `/api/superadmin/admins` | SUPER_ADMIN | Create admin |
| `GET` | `/api/superadmin/admins` | SUPER_ADMIN | List admins |
| `PUT` | `/api/superadmin/admins/{id}/toggle` | SUPER_ADMIN | Toggle admin |
| `DELETE` | `/api/superadmin/admins/{id}` | SUPER_ADMIN | Delete admin |
| `GET` | `/api/superadmin/hostels` | SUPER_ADMIN | All hostels |
| `POST` | `/api/superadmin/hostels` | SUPER_ADMIN | Create hostel |
| `PUT` | `/api/superadmin/hostels/{id}/assign` | SUPER_ADMIN | Assign hostel |
| `PUT` | `/api/superadmin/hostels/{id}/unassign` | SUPER_ADMIN | Unassign hostel |
| `DELETE` | `/api/superadmin/hostels/{id}` | SUPER_ADMIN | Delete hostel |
| `GET` | `/api/superadmin/stats` | SUPER_ADMIN | Global platform stats |
| `GET` | `/api/superadmin/me` | SUPER_ADMIN | Get own profile |
| `PUT` | `/api/superadmin/me` | SUPER_ADMIN | Update own profile |
| `GET` | `/api/notifications` | Any auth | Get notifications (paged) |
| `GET` | `/api/notifications/unread-count` | Any auth | Unread count |
| `PUT` | `/api/notifications/{id}/read` | Any auth | Mark as read |
| `PUT` | `/api/notifications/read-all` | Any auth | Mark all as read |
| `DELETE` | `/api/notifications/{id}` | Any auth | Delete notification |
