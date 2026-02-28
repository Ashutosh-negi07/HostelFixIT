# HostelFixIT — Backend

Spring Boot REST API for hostel complaint management.

## Tech Stack

- **Java 17** / **Spring Boot 4.0**
- Spring Security + JWT (HS512, 24 hr expiry)
- Spring Data JPA + PostgreSQL
- Cloudinary (image uploads)
- Lombok, Jakarta Validation

## Roles

| Role | Description |
|------|-------------|
| ADMIN | Full CRUD on users, hostels, categories, complaints |
| WARDEN | Manages students/workers and complaints in own hostel |
| STUDENT | Files complaints, gives feedback |
| WORKER | Resolves assigned complaints |

## Quick Start

```bash
# 1. Copy env template and fill in values
cp .env.example .env

# 2. Run with Maven
./mvnw spring-boot:run

# 3. Or with Docker
docker compose up --build
```

## Environment Variables

See [.env.example](.env.example) for the full list.

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_URL` | Yes | JDBC PostgreSQL connection URL |
| `DB_USERNAME` | Yes | Database username |
| `DB_PASSWORD` | Yes | Database password |
| `JWT_SECRET` | Yes | ≥256-bit secret for HS512 signing |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (default: `http://localhost:3000`) |

## API Overview

| Prefix | Access |
|--------|--------|
| `POST /api/auth/login` | Public |
| `POST /api/auth/logout` | Authenticated |
| `/api/admin/**` | ADMIN |
| `/api/dashboard/**` | ADMIN, WARDEN |
| `/api/warden/**` | WARDEN |
| `/api/student/**` | STUDENT |
| `/api/worker/**` | WORKER |

All list endpoints support **pagination** (`?page=0&size=20`) and **sorting** (`?sortBy=createdAt&order=desc`).
Complaint endpoints also accept **filters**: `status`, `priority`, `categoryId`, `hostelId`.

## Project Structure

```
src/main/java/com/HoCom/backend/
├── Config/         # Security, JWT, Cloudinary, GlobalExceptionHandler
├── controller/     # REST controllers per role
├── dto/            # Request/response DTOs
├── models/         # JPA entities
├── repositories/   # Spring Data repos + ComplaintSpecification
└── service/        # Business logic interfaces + impls
```
