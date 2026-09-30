# HostelFixIT — Cloudinary & Supabase Integration Guide

> **Purpose:** A developer-focused walkthrough of exactly how Cloudinary (photo storage) and Supabase (PostgreSQL database) are wired into the HostelFixIT Spring Boot backend — from account setup to the running code.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Supabase — PostgreSQL Database](#2-supabase--postgresql-database)
   - [Why Supabase?](#why-supabase)
   - [Connection Architecture](#connection-architecture)
   - [JDBC URL Format](#jdbc-url-format)
   - [Connection Pool (HikariCP)](#connection-pool-hikaricp)
   - [How Spring Boot Connects](#how-spring-boot-connects)
   - [Flyway Runs on Top](#flyway-runs-on-top)
3. [Cloudinary — Photo Storage](#3-cloudinary--photo-storage)
   - [Why Cloudinary?](#why-cloudinary)
   - [Maven Dependency](#maven-dependency)
   - [Configuration Bean](#configuration-bean)
   - [CloudinaryService — Upload](#cloudinaryservice--upload)
   - [CloudinaryService — Delete](#cloudinaryservice--delete)
   - [Public ID Extraction Logic](#public-id-extraction-logic)
   - [Where Photos Are Used](#where-photos-are-used)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [How to Set Up From Scratch](#5-how-to-set-up-from-scratch)
   - [Supabase Setup](#supabase-setup)
   - [Cloudinary Setup](#cloudinary-setup)
   - [Wiring into the App](#wiring-into-the-app)
6. [Connection Troubleshooting](#6-connection-troubleshooting)

---

## 1. Overview

| Service | Role | Integration Point |
|---|---|---|
| **Supabase** | Managed PostgreSQL database | JDBC via HikariCP → Spring Data JPA → Hibernate |
| **Cloudinary** | CDN photo/file storage | REST SDK via `CloudinaryService` Java bean |

Neither service has a custom client library unique to this project — they use standard interfaces:
- Supabase exposes a **standard PostgreSQL wire protocol** endpoint → any JDBC driver works.
- Cloudinary provides an official **Java SDK** (`cloudinary-http44`) that wraps their REST upload API.

---

## 2. Supabase — PostgreSQL Database

### Why Supabase?

Supabase is a Firebase alternative that provides a **managed PostgreSQL instance** (hosted on AWS). Benefits for this project:
- Free tier with up to 20 concurrent connections.
- PostgreSQL — the same database that would be used in production.
- No database server to manage locally.
- Built-in dashboard for browsing tables, running SQL queries.

> Supabase is used **only as a database host**. The app doesn't use Supabase Auth, Supabase Realtime, or any Supabase SDKs — just the raw PostgreSQL connection.

---

### Connection Architecture

```
Spring Boot App (localhost:8080)
        │
        │  JDBC over TCP/IP (port 6543 — Supabase pooler)
        │  sslmode=require
        ▼
Supabase PgBouncer Pooler (Transaction Mode)
  aws-0-ap-northeast-1.pooler.supabase.com:6543
        │
        ▼
Supabase PostgreSQL (actual DB)
  Project: xvogazjnqddlrqoxzale
  Database: postgres
```

The app connects to Supabase's **PgBouncer connection pooler** (port `6543`), NOT directly to PostgreSQL (port `5432`). The pooler manages the physical connections to the actual database.

---

### JDBC URL Format

From `.env`:
```
DB_URL=jdbc:postgresql://aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0
```

Breaking it down:

| Part | Value | Meaning |
|---|---|---|
| `jdbc:postgresql://` | protocol | Standard PostgreSQL JDBC driver |
| `aws-0-ap-northeast-1.pooler.supabase.com` | host | Supabase pooler endpoint (Asia Pacific) |
| `:6543` | port | PgBouncer pooler port (NOT 5432) |
| `/postgres` | database | Default Supabase database name |
| `sslmode=require` | TLS | Enforce encrypted connection |
| `prepareThreshold=0` | JDBC param | **Critical for PgBouncer** |

#### Why `prepareThreshold=0`?

PgBouncer in **transaction mode** does not support **server-side prepared statements**. By default, the PostgreSQL JDBC driver automatically switches to prepared statements after a query is run 5 times. Setting `prepareThreshold=0` disables this feature, forcing the driver to always use simple queries — which PgBouncer handles correctly.

Without this parameter, you'd see errors like:
```
ERROR: prepared statement "S_1" does not exist
```

---

### Connection Pool (HikariCP)

Spring Boot uses **HikariCP** as its default JDBC connection pool. Supabase free tier allows a maximum of **20 concurrent connections** from all sources — the pool is tuned conservatively to stay within this limit.

```properties
# application.properties — Supabase-tuned HikariCP settings
spring.datasource.hikari.maximum-pool-size=${HIKARI_MAX_POOL:3}    # default: 3 connections
spring.datasource.hikari.minimum-idle=${HIKARI_MIN_IDLE:1}         # keep at least 1 warm
spring.datasource.hikari.connection-timeout=20000                   # wait 20s before failing
spring.datasource.hikari.idle-timeout=300000                        # release idle after 5 min
spring.datasource.hikari.max-lifetime=600000                        # recycle after 10 min
spring.datasource.hikari.keepalive-time=60000                       # ping idle connections every 60s
```

The `keepalive-time` is important for Supabase — idle connections can be dropped by the cloud provider after a timeout. The keepalive sends a lightweight ping to keep the connection open.

---

### How Spring Boot Connects

**Step 1 — `application.properties` reads env vars:**
```properties
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
```

**Step 2 — Spring auto-configures `DataSource`:**
Spring Boot's `DataSourceAutoConfiguration` reads these properties and creates a HikariCP `DataSource` bean automatically — no manual `@Bean` needed.

**Step 3 — JPA/Hibernate uses the DataSource:**
```properties
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.open-in-view=false
```

- `ddl-auto=validate` — Hibernate **validates** that the DB schema matches the entity mappings. It does NOT create or alter tables. That's Flyway's job.
- `open-in-view=false` — Disables the anti-pattern of keeping DB sessions open during view rendering. Better performance and clearer transaction boundaries.

**Step 4 — Repositories query via JPA:**
```java
@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, UUID>,
                                              JpaSpecificationExecutor<Complaint> {
    // Spring Data generates SQL; Hibernate translates; HikariCP delivers the connection
}
```

---

### Flyway Runs on Top

Flyway uses the **same `DataSource`** that Spring configures. It runs before Hibernate schema validation:

```properties
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.baseline-version=1
spring.flyway.locations=classpath:db/migration
spring.jpa.defer-datasource-initialization=true  # Flyway first, then Hibernate validate
```

On startup sequence:
```
1. HikariCP pool initializes → connects to Supabase
2. Flyway checks flyway_schema_history table in Supabase
3. Runs any pending migrations (V2, V3, V4...) against Supabase
4. Hibernate validates entity ↔ table mappings
5. Spring Boot finishes starting → app ready
```

Migration files live in `src/main/resources/db/migration/`:

| File | What it does |
|---|---|
| `V1__init_schema.sql` | Creates all base tables (`users`, `hostels`, `complaints`, `categories`, `feedback`, `complaint_status_history`) |
| `V2__add_notifications.sql` | Adds `notifications` table + index |
| `V3__add_super_admin.sql` | Adds `admin_id` column to `hostels`; adds `SUPER_ADMIN` to role constraint |
| `V4__fix_role_constraint.sql` | Re-applies role constraint (V3 was rolled back by a DataInitializer failure) |

---

## 3. Cloudinary — Photo Storage

### Why Cloudinary?

Cloudinary is a cloud media management service. Benefits for this project:
- **Free tier** — generous upload limits for development.
- **No server storage** — photos are stored on Cloudinary's CDN, not on the Spring Boot server's disk.
- **CDN delivery** — photos are served fast from Cloudinary's CDN to the frontend.
- **Auto-optimization** — Cloudinary can resize/compress on the fly via URL parameters.
- **Simple Java SDK** — one dependency, three config values.

---

### Maven Dependency

```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.cloudinary</groupId>
    <artifactId>cloudinary-http44</artifactId>
    <version>1.39.0</version>
</dependency>
```

`cloudinary-http44` uses Apache HttpClient 4.4 under the hood to make REST calls to Cloudinary's upload API.

---

### Configuration Bean

**File:** `Cloudinaryconfig.java`

```java
@Configuration
public class Cloudinaryconfig {

    @Value("${cloudinary.cloud-name}")   // from CLOUDINARY_CLOUD_NAME env var
    private String cloudName;

    @Value("${cloudinary.api-key}")       // from CLOUDINARY_API_KEY env var
    private String apiKey;

    @Value("${cloudinary.api-secret}")    // from CLOUDINARY_API_SECRET env var
    private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(Map.of(
                "cloud_name", cloudName,
                "api_key",    apiKey,
                "api_secret", apiSecret
        ));
    }
}
```

`application.properties` maps the env vars:
```properties
cloudinary.cloud-name=${CLOUDINARY_CLOUD_NAME}
cloudinary.api-key=${CLOUDINARY_API_KEY}
cloudinary.api-secret=${CLOUDINARY_API_SECRET}
```

`.env` provides the actual values:
```
CLOUDINARY_CLOUD_NAME=ddmog9gmh
CLOUDINARY_API_KEY=517361626893892
CLOUDINARY_API_SECRET=-LYDcjbhOjoHP1mLDZoWaOBugkc
```

The `Cloudinary` object is a **singleton Spring bean** injected into `CloudinaryService`.

---

### CloudinaryService — Upload

**File:** `CloudinaryService.java`

```java
@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;  // injected by Spring

    public String upload(MultipartFile file) {
        try {
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),         // raw bytes from the multipart upload
                    ObjectUtils.emptyMap()   // no special options (folder, transformations, etc.)
            );
            return uploadResult.get("url").toString();  // public CDN URL

        } catch (Exception e) {
            throw new RuntimeException("Upload failed", e);
        }
    }
}
```

**What `uploadResult` contains (from Cloudinary API):**
```json
{
  "public_id": "abcdef123",
  "url": "http://res.cloudinary.com/ddmog9gmh/image/upload/v1720000000/abcdef123.jpg",
  "secure_url": "https://res.cloudinary.com/ddmog9gmh/image/upload/v1720000000/abcdef123.jpg",
  "format": "jpg",
  "bytes": 48291,
  "width": 800,
  "height": 600
}
```

Only the `url` string is extracted and stored in `complaints.photo_url`.

> **Note:** The current implementation uses `http://` (non-secure) URL. A simple improvement is to use `uploadResult.get("secure_url")` instead to always get `https://`.

#### Upload flow — end-to-end

```
Client → POST /api/student/complaints
         Content-Type: multipart/form-data
         photo = <binary image data>

StudentController.createComplaint()
  ├── if photo != null && !photo.isEmpty():
  │     photoUrl = cloudinaryService.upload(photo)
  │         → file.getBytes()               // read into memory
  │         → cloudinary.uploader().upload(bytes, emptyMap())
  │             → HTTP POST to https://api.cloudinary.com/v1_1/ddmog9gmh/image/upload
  │             → signed with API key + secret (Cloudinary SDK handles signing)
  │         ← returns { url: "http://res.cloudinary.com/..." }
  │
  └── complaintService.createComplaint(request.photoUrl = photoUrl, ...)
        → complaint.photoUrl = "http://res.cloudinary.com/..."
        → complaintRepository.save(complaint)
```

---

### CloudinaryService — Delete

```java
public void delete(String imageUrl) {
    if (imageUrl == null || imageUrl.isBlank()) return;
    try {
        String publicId = extractPublicId(imageUrl);
        if (publicId != null) {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        }
    } catch (Exception e) {
        // Fail silently — cleanup failure must not break the main operation
        System.err.println("Cloudinary cleanup failed for: " + imageUrl + " — " + e.getMessage());
    }
}
```

**Silent failure design:** If Cloudinary deletion fails (network timeout, invalid ID, etc.), the error is logged to stderr but the exception is swallowed. This is intentional — a photo cleanup failure should not cause the student's `cancelComplaint` or `updateComplaint` request to fail.

**Called in two places:**
1. `ComplaintServiceImpl.updateComplaint()` — before replacing an old photo.
2. `ComplaintServiceImpl.cancelComplaint()` — before deleting the complaint record.

---

### Public ID Extraction Logic

Cloudinary's `destroy()` API takes a **public ID**, not a URL. The public ID must be extracted from the stored URL.

```java
private String extractPublicId(String url) {
    // Example URL:
    // http://res.cloudinary.com/ddmog9gmh/image/upload/v1720000000/abcdef123.jpg

    // Step 1: Remove query parameters
    String clean = url.contains("?") ? url.substring(0, url.indexOf("?")) : url;

    // Step 2: Find "/upload/" segment
    int uploadIdx = clean.indexOf("/upload/");
    if (uploadIdx == -1) return null;
    String afterUpload = clean.substring(uploadIdx + "/upload/".length());
    // afterUpload = "v1720000000/abcdef123.jpg"

    // Step 3: Skip the version segment (v1234567890/)
    if (afterUpload.startsWith("v") && afterUpload.contains("/")) {
        afterUpload = afterUpload.substring(afterUpload.indexOf("/") + 1);
        // afterUpload = "abcdef123.jpg"
    }

    // Step 4: Remove file extension
    int dotIdx = afterUpload.lastIndexOf(".");
    return dotIdx != -1 ? afterUpload.substring(0, dotIdx) : afterUpload;
    // returns "abcdef123"
}
```

**With folders:** If you configure Cloudinary to store in a folder (e.g., `hostelfixit/complaints/`), the public ID would be `hostelfixit/complaints/abcdef123` — the extraction logic handles this since it only removes the version prefix and extension.

---

### Where Photos Are Used

| Endpoint | Operation | Cloudinary action |
|---|---|---|
| `POST /api/student/complaints` | File new complaint | `upload()` → store URL |
| `PUT /api/student/complaints/{id}` | Update complaint | `delete(old)` + `upload(new)` |
| `DELETE /api/student/complaints/{id}` | Cancel complaint | `delete(url)` |

Photos are **never stored on the server disk** — only in memory during the upload call (`file.getBytes()`), then immediately pushed to Cloudinary.

---

## 4. Environment Variables Reference

All configuration is injected via environment variables, read from the `.env` file (loaded by Spring's `spring.config.import=optional:file:.env[.properties]`).

### Supabase (Database)

| Env Var | Example Value | Purpose |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://aws-0-...pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0` | Full JDBC connection URL |
| `DB_USERNAME` | `postgres.xvogazjnqddlrqoxzale` | Supabase DB user (project-scoped) |
| `DB_PASSWORD` | `your_password` | Supabase DB password |
| `HIKARI_MAX_POOL` | `3` | Max DB connections in pool (keep ≤ 20 for Supabase free tier) |
| `HIKARI_MIN_IDLE` | `1` | Min idle connections |

> The Supabase username format is `postgres.<project-ref>`. This is Supabase's standard format for connecting via the pooler.

### Cloudinary

| Env Var | Example Value | Purpose |
|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | `ddmog9gmh` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | `517361626893892` | Public API key |
| `CLOUDINARY_API_SECRET` | `-LYDcjb...` | Private API secret (keep this secret!) |

---

## 5. How to Set Up From Scratch

### Supabase Setup

1. **Create a Supabase account** at [supabase.com](https://supabase.com) → New Project.

2. **Get connection string:**
   - Dashboard → Project Settings → Database → **Connection string** tab.
   - Select **Transaction** mode (port 6543, for PgBouncer) — NOT Session mode (port 5432).
   - Copy the URI. It looks like:
     ```
     postgresql://postgres.xvogazjnqddlrqoxzale:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
     ```
   - Convert to JDBC format:
     ```
     jdbc:postgresql://aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0
     ```
   - The password is the one you set when creating the project.

3. **Set env vars in `.env`:**
   ```
   DB_URL=jdbc:postgresql://aws-0-...:6543/postgres?sslmode=require&prepareThreshold=0
   DB_USERNAME=postgres.your-project-ref
   DB_PASSWORD=your-project-password
   ```

4. **Run the app** — Flyway will auto-create all tables on first startup via `V1__init_schema.sql`.

> **Tip:** You can verify the tables were created in Supabase Dashboard → Table Editor.

---

### Cloudinary Setup

1. **Create a Cloudinary account** at [cloudinary.com](https://cloudinary.com/users/register_free) → Free tier.

2. **Get credentials:**
   - Dashboard → top panel shows **Cloud Name**, **API Key**, **API Secret**.

3. **Set env vars in `.env`:**
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Test:** Submit a complaint with a photo via `POST /api/student/complaints`. Check Cloudinary Dashboard → Media Library — the image should appear there.

---

### Wiring into the App

Everything is auto-wired by Spring — no manual setup needed beyond the `.env` file:

```
.env file
   │
   ├── DB_* vars ──────────→ application.properties (spring.datasource.*)
   │                              └──→ HikariCP DataSource bean
   │                                      └──→ JPA / Flyway / Repositories
   │
   └── CLOUDINARY_* vars ──→ application.properties (cloudinary.*)
                                  └──→ Cloudinaryconfig.java (@Value injection)
                                          └──→ Cloudinary bean
                                                  └──→ CloudinaryService
                                                          └──→ StudentController
```

---

## 6. Connection Troubleshooting

### Supabase

| Symptom | Likely Cause | Fix |
|---|---|---|
| `Connection refused` on port 6543 | Using wrong port | Use 6543 (pooler), not 5432 |
| `SSL connection required` | Missing sslmode | Add `?sslmode=require` to URL |
| `prepared statement "S_1" does not exist` | Missing prepareThreshold | Add `&prepareThreshold=0` to URL |
| `FATAL: too many connections` | Pool too large | Reduce `HIKARI_MAX_POOL` (keep ≤ 20) |
| `Connection is closed` after idle | HikariCP keepalive not set | Ensure `keepalive-time=60000` |
| Flyway migration fails | Schema already partially exists | Check `flyway_schema_history` table in Supabase |
| `role "X" does not exist` CHECK violation | Role constraint stale | V4 migration fixes this; re-run Flyway |

### Cloudinary

| Symptom | Likely Cause | Fix |
|---|---|---|
| `Upload failed` exception | Wrong credentials | Double-check API key, secret, cloud name |
| Photo uploads but delete silently fails | Public ID extraction failing | Check URL format; look at stderr logs |
| `Invalid API key` | Env var not loaded | Verify `.env` file path; restart app |
| `File too large` | Exceeds 10 MB limit | Configured in `application.properties` multipart settings |
| URL uses `http://` not `https://` | Using `url` not `secure_url` | Change `uploadResult.get("url")` to `uploadResult.get("secure_url")` |
