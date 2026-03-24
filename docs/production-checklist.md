# Backend Production Readiness Checklist

> Track what's done and what needs fixing before deploying HostelFixIT to production.

---

## ✅ Already Done

- [x] **Flyway migrations** — `ddl-auto=validate`, versioned SQL files
- [x] **JWT auth** — HS512, 24h expiry, token blacklisting on logout
- [x] **Role-based security** — ADMIN / WARDEN / STUDENT / WORKER routes locked down
- [x] **GlobalExceptionHandler** — no stack traces leaked to clients, safe-message whitelist
- [x] **CORS** — configurable via `CORS_ORIGINS` env var
- [x] **Secrets in env vars** — DB password, JWT secret, Cloudinary secret all externalized
- [x] **Input validation** — Jakarta Validation on all request DTOs
- [x] **In-app notifications** — complaint lifecycle events trigger notifications
- [x] **Pagination** — all list endpoints paginated with configurable size
- [x] **Complaint status history** — full audit trail of status changes

---

## 🔴 Critical — Must Fix Before Production

### 1. Hardcoded Admin Password
**File:** `DataInitializer.java:32`
```java
// CURRENT — anyone who reads your code knows the admin password
.password(passwordEncoder.encode("123"))
```
**Fix:** Use environment variable:
```java
@Value("${admin.default-password:CHANGE_ME}")
private String adminDefaultPassword;
// then use: passwordEncoder.encode(adminDefaultPassword)
```

---

### 2. Hardcoded DB Credentials as Defaults
**File:** `application.properties:7-8`
```properties
# CURRENT — Supabase URL and username baked into the file
spring.datasource.url=${DB_URL:jdbc:postgresql://aws-1-ap-northeast-1.pooler.supabase.com:6543/...}
spring.datasource.username=${DB_USERNAME:postgres.xvogazjnqddlrqoxzale}
```
**Fix:** Remove the fallback defaults. In production, the deploy will fail loudly if env vars are missing — which is what you want:
```properties
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
```

---

### 3. Hardcoded Cloudinary Credentials as Defaults
**File:** `application.properties:25-26`
```properties
cloudinary.cloud-name=${CLOUDINARY_CLOUD_NAME:ddmog9gmh}
cloudinary.api-key=${CLOUDINARY_API_KEY:517361626893892}
```
**Fix:** Same — remove fallbacks, require env vars.

---

### 4. `show-sql=true` in Production
**File:** `application.properties:12`
```properties
spring.jpa.show-sql=true  # prints every SQL query to stdout — slows things down
```
**Fix:** Set to `false` for production, or use a Spring profile:
```properties
spring.jpa.show-sql=${SHOW_SQL:false}
```

---

### 5. No Dockerfile
The README mentions Docker but there's no `Dockerfile`. Create one for Railway/Render/Fly.io:
```dockerfile
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 🟡 Medium Priority — Should Do

### 6. No Rate Limiting on Login
Brute-force attacks can try unlimited passwords. Add a rate limiter:
- Option A: Use `bucket4j-spring-boot-starter` (code-level)
- Option B: Use API gateway rate limiting (Railway/Cloudflare)

### 7. No Refresh Token Flow
JWT expires in 24h → user must re-login. Add a `/api/auth/refresh` endpoint with rotating refresh tokens stored in DB.

### 8. No Password Reset
No way for users to recover forgotten passwords. Needs an email service + reset-token flow.

### 9. No API Documentation (Swagger)
Frontend developers have to guess endpoints. Add `springdoc-openapi-starter-webmvc-ui` for auto-generated Swagger UI at `/swagger-ui.html`.

### 10. No Health Check Endpoint
Railway/Render need a health check URL. Spring Boot Actuator gives you `/actuator/health` for free:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

### 11. Connection Pool Tuning
HikariCP defaults are fine for dev but may need tuning:
```properties
spring.datasource.hikari.maximum-pool-size=${HIKARI_MAX_POOL:10}
spring.datasource.hikari.minimum-idle=${HIKARI_MIN_IDLE:5}
```

### 12. Old Cloudinary Images Not Cleaned Up
When a complaint photo is updated, the old image stays in Cloudinary forever, wasting storage.

---

## 🟢 Nice-to-Have — Post-Launch

- [ ] **Tests** — unit + integration tests for critical paths (auth, complaint lifecycle)
- [ ] **Spring Profiles** — separate `application-dev.properties` and `application-prod.properties`
- [ ] **Structured logging** — JSON logs for production (easier to parse in log aggregators)
- [ ] **Escalation feature** — commented-out in `Complaint.java`, implement when needed
- [ ] **Text search** — search complaints by description/keyword
- [ ] **Bulk operations** — assign multiple complaints to a worker at once
- [ ] **Email notifications** — complement in-app notifications
- [ ] **Student/Worker dashboard stats** — only Admin/Warden have stats currently

---

## Deployment Quick Reference

### Railway (Backend)
```bash
# Env vars to set in Railway dashboard:
DB_URL=jdbc:postgresql://...
DB_USERNAME=...
DB_PASSWORD=...
JWT_SECRET=<256-bit-random-string>
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CORS_ORIGINS=https://your-frontend.vercel.app
```

### Priority Order
1. Fix items **1-5** (30 min total)
2. Add Dockerfile (item 5) + Actuator health check (item 10)
3. Deploy to Railway
4. Add rate limiting + Swagger over time
