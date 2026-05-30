# Flyway Database Migrations — How It Works

> Flyway manages your database schema via versioned SQL files instead of letting Hibernate auto-modify tables.

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                   Spring Boot starts                     │
│                         ↓                                │
│  Flyway checks: flyway_schema_history table exists?      │
│       ↓ NO                          ↓ YES                │
│  Creates it + baselines at V1   Reads last applied       │
│       ↓                         version (e.g. V1)        │
│  Finds pending migrations       Finds pending: V2        │
│       ↓                              ↓                   │
│  Runs V2__add_notifications.sql (skips V1, baseline)     │
│       ↓                                                  │
│  Records V2 in flyway_schema_history                     │
│       ↓                                                  │
│  Hibernate validates schema matches Java entities        │
│       ↓                                                  │
│  App starts normally ✅                                   │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure

```
src/main/resources/
└── db/migration/
    ├── V1__init_schema.sql          ← baseline (all existing tables)
    └── V2__add_notifications.sql    ← first real migration
```

**Naming convention:** `V{number}__{description}.sql` (two underscores!)

---

## Configuration (application.properties)

```properties
# Hibernate only VALIDATES schema — never modifies it
spring.jpa.hibernate.ddl-auto=validate

# Flyway runs migrations before Hibernate validates
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true   # existing DB → marks V1 as "already applied"
spring.flyway.baseline-version=1         # V1 is the baseline
spring.flyway.locations=classpath:db/migration
```

---

## Workflow: Adding a New Table or Column

### Step 1 — Create a migration file

Create a new SQL file in `src/main/resources/db/migration/`:

```sql
-- V3__add_room_number_to_complaints.sql

ALTER TABLE complaints ADD COLUMN room_number VARCHAR(50);
```

### Step 2 — Update the Java entity

```java
// In Complaint.java
@Column
private String roomNumber;
```

### Step 3 — Restart the server

Flyway automatically runs `V3` on startup. Hibernate then validates the schema matches.

---

## Workflow: Renaming a Column

```sql
-- V4__rename_photo_url.sql

ALTER TABLE complaints RENAME COLUMN photo_url TO image_url;
```

Then update the Java entity:

```java
// Before
@Column
private String photoUrl;

// After
@Column(name = "image_url")
private String imageUrl;
```

> **This is exactly what `ddl-auto=update` would get wrong** — it would DROP the old column (losing data!) and CREATE a new empty one.

---

## Workflow: Adding an Index

```sql
-- V5__add_complaint_status_index.sql

CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_hostel_status ON complaints(hostel_id, status);
```

No Java changes needed — indexes are DB-only.

---

## Rules

| Rule | Explanation |
|------|-------------|
| **Never edit a migration that has already been applied** | Flyway checksums each file. Editing V1 after it ran will crash the app |
| **Always create a NEW file** | Even for a small fix, create V6, V7, etc. |
| **Test locally first** | Run migrations on your dev DB before pushing |
| **Naming: `V{N}__{desc}.sql`** | Two underscores. No gaps in version numbers |

---

## Useful Commands

```bash
# Check migration status
./mvnw flyway:info -Dflyway.url=jdbc:postgresql://... -Dflyway.user=... -Dflyway.password=...

# Repair broken checksums (use with caution)
./mvnw flyway:repair -Dflyway.url=...

# Force-apply all pending migrations
./mvnw flyway:migrate -Dflyway.url=...
```

---

## Current Migration History

| Version | File | Description |
|---------|------|-------------|
| V1 | `V1__init_schema.sql` | Baseline — hostels, users, categories, complaints, feedback, status history |
| V2 | `V2__add_notifications.sql` | In-app notifications table + index |

---

## Before vs After

| | Before (ddl-auto=update) | After (Flyway) |
|---|---|---|
| Who controls the DB? | Hibernate (automatic) | You (explicit SQL) |
| Can rename a column safely? | ❌ Data loss | ✅ `ALTER TABLE RENAME` |
| Can rollback? | ❌ No history | ✅ Write a reverse migration |
| Production safe? | ❌ Risky | ✅ Predictable |
| History tracked? | ❌ | ✅ `flyway_schema_history` table |
