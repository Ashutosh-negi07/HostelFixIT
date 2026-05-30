# HostelFixIT 🏠🔧

A full-stack hostel complaint management system. Students file complaints, wardens assign them to workers, workers resolve them — with real-time notifications and photo uploads at every step.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), Vanilla CSS |
| **Backend** | Spring Boot 3, Java 17 |
| **Database** | PostgreSQL + Flyway migrations |
| **Auth** | Spring Security + JWT (HS512, 24 hr expiry) |
| **Storage** | Cloudinary (complaint photo uploads) |
| **Load Testing** | k6 (smoke · load · stress · soak) |

---

## Roles

| Role | What they can do |
|------|-----------------|
| **SUPER_ADMIN** | Creates admins, creates & assigns hostels |
| **ADMIN** | Manages users, categories, hostels, views all complaints |
| **WARDEN** | Manages students/workers in their hostel, assigns complaints to workers |
| **WORKER** | Views and resolves complaints assigned to them |
| **STUDENT** | Files complaints, uploads photos, gives feedback, cancels PENDING complaints |

---

## Project Structure

```
HostelFixIT/
├── backend/          # Spring Boot REST API
│   ├── src/
│   │   └── main/
│   │       ├── java/com/HoCom/backend/
│   │       │   ├── Config/         # Security, JWT, Cloudinary, CORS, GlobalExceptionHandler
│   │       │   ├── controller/     # REST controllers per role
│   │       │   ├── dto/            # Request / Response DTOs
│   │       │   ├── models/         # JPA entities (User, Complaint, Notification…)
│   │       │   ├── repositories/   # Spring Data JPA repos + ComplaintSpecification
│   │       │   └── service/        # Business logic interfaces + implementations
│   │       └── resources/
│   │           ├── application.properties
│   │           └── db/migration/   # Flyway SQL migrations (V1–V4)
│   ├── .env.example
│   └── pom.xml
│
├── frontend/         # Next.js 14 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/
│   │   │   ├── admin/
│   │   │   ├── warden/
│   │   │   ├── student/
│   │   │   ├── worker/
│   │   │   └── superadmin/
│   │   ├── components/   # Shared UI (AppLayout, Sidebar, modals…)
│   │   ├── lib/          # api.js (Axios + interceptors), store.js (auth)
│   │   └── hooks/        # useAuth, useNotifications
│   ├── .env.example
│   └── package.json
│
└── tests/
    └── k6/           # Load test suite (smoke/load/stress/soak)
```

---

## Quick Start

### Prerequisites

- Java 17+
- Node.js 18+
- PostgreSQL 14+ (local or Supabase/Neon)
- Cloudinary account (free tier is fine)

### 1 — Backend

```bash
cd backend

# Copy env template and fill in values
cp .env.example .env

# Run with Maven wrapper
./mvnw spring-boot:run
# API available at http://localhost:8080
```

### 2 — Frontend

```bash
cd frontend

# Copy env template
cp .env.example .env.local

# Install and run
npm install
npm run dev
# App available at http://localhost:3000
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_URL` | ✅ | JDBC URL — e.g. `jdbc:postgresql://localhost:5432/hostelfixit` |
| `DB_USERNAME` | ✅ | Database username |
| `DB_PASSWORD` | ✅ | Database password |
| `JWT_SECRET` | ✅ | ≥256-bit random string for HS512 signing |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `CORS_ORIGINS` | ❌ | Comma-separated allowed origins (default: `http://localhost:3000`) |
| `HIKARI_MAX_POOL` | ❌ | Max DB connection pool size (default: `10`, recommend `25` for production) |
| `HIKARI_MIN_IDLE` | ❌ | Min idle connections (default: `5`) |
| `SHOW_SQL` | ❌ | Log Hibernate SQL queries — `true`/`false` (default: `false`) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend base URL — e.g. `http://localhost:8080` |

---

## API Overview

All endpoints require a JWT Bearer token except `/api/auth/login`.

| Prefix | Roles allowed |
|--------|--------------|
| `POST /api/auth/login` | Public |
| `POST /api/auth/logout` | Any authenticated |
| `GET  /api/auth/me` | Any authenticated |
| `/api/superadmin/**` | SUPER_ADMIN |
| `/api/admin/**` | ADMIN |
| `/api/dashboard/**` | ADMIN, WARDEN |
| `/api/warden/**` | WARDEN |
| `/api/worker/**` | WORKER |
| `/api/student/**` | STUDENT |
| `/api/notifications/**` | Any authenticated |

**Pagination** (all list endpoints): `?page=0&size=20&sortBy=createdAt&order=desc`

**Complaint filters**: `?status=PENDING&priority=HIGH&categoryId=<uuid>&hostelId=<uuid>`

**Complaint statuses**: `PENDING → ASSIGNED → IN_PROGRESS → RESOLVED` (or `REJECTED` / `CANCELLED`)

---

## Database Migrations

Flyway runs automatically on startup. Migrations live in `backend/src/main/resources/db/migration/`:

| File | Description |
|------|-------------|
| `V1__init_schema.sql` | Core tables: users, hostels, categories, complaints, feedback, notifications |
| `V2__add_notifications.sql` | Notification enhancements |
| `V3__add_super_admin.sql` | SuperAdmin role support |
| `V4__fix_role_constraint.sql` | Role enum constraint fix |

---

## Load Testing (k6)

```bash
cd tests/k6

# Run full suite (smoke + load + stress + soak)
bash run-tests.sh

# Override soak duration (default 30m, useful for CI)
SOAK_DURATION=2m bash run-tests.sh

# Results saved to tests/k6/results/
```

**Benchmark results** (local MacBook, Supabase DB):
- Peak throughput: **180 req/s** at 90 concurrent users
- p(95) latency: **202ms** under stress
- Zero crashes or memory leaks across all scenarios

---

## Key Design Decisions

- **Hard delete is blocked for users with complaint history** — complaint records must be preserved for audit. Use "deactivate" (toggle-active) instead.
- **Notifications are soft — FK-safe cleanup** on user delete removes their notifications first.
- **Multipart form-data for complaints** — supports optional photo upload via Cloudinary in a single request.
- **GlobalExceptionHandler** maps all `RuntimeException`s to 400/404/409 with safe error messages — no stack traces leak to clients.
- **JWT blacklist on logout** — invalidated tokens are stored in-memory until expiry.
