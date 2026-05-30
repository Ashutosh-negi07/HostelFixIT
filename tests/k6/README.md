# HostelFixIT — k6 Load Tests

Performance and API correctness tests using [k6](https://k6.io).

## Prerequisites

```bash
# macOS (Homebrew)
brew install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Docker
docker pull grafana/k6
```

## Project Structure

```
tests/k6/
├── config.js              # Base URL, credentials, shared thresholds
├── helpers.js             # login/logout, HTTP wrappers, assertion helpers
├── modules/
│   ├── auth.js            # Login / /me / logout / blacklist checks
│   ├── student.js         # Full student journey (profile → complaint CRUD)
│   ├── warden.js          # Warden journey (counts → assign → students/workers)
│   ├── worker.js          # Worker journey (counts → start progress → resolve)
│   ├── admin.js           # Admin journey (profile → stats → categories/hostels/users)
│   └── superadmin.js      # SuperAdmin journey (admin/hostel CRUD + toggle)
├── smoke.js               # 1 VU · 1 pass — quick sanity check
├── load.js                # Normal traffic · 5 minutes · 26 VUs peak
├── stress.js              # 3× traffic · 9 minutes · 90 VUs peak
└── soak.js                # Normal traffic · 30 minutes — memory/leak detection
```

## Setup

### 1. Start the backend
```bash
cd backend
./mvnw spring-boot:run
```

### 2. Seed the database
The k6 tests require specific user accounts to exist. Run the seed script:
```bash
node seed.js
```

Or manually ensure these accounts exist in your database:

| Role       | Email                          | Password        |
|------------|--------------------------------|-----------------|
| SUPER_ADMIN | `superadmin@hostelfixit.com`  | `superadmin123` |
| ADMIN      | `admin@hostelfixit.com`        | `admin123`      |
| WARDEN     | `warden@hostelfixit.com`       | `warden123`     |
| WORKER     | `worker@hostelfixit.com`       | `worker123`     |
| STUDENT    | `student@hostelfixit.com`      | `student123`    |

## Running Tests

### Smoke Test (sanity check — ~30 seconds)
```bash
k6 run tests/k6/smoke.js
```

### Load Test (realistic traffic — ~5 minutes)
```bash
k6 run tests/k6/load.js
```

### Stress Test (find breaking point — ~9 minutes)
```bash
k6 run tests/k6/stress.js
```

### Soak Test (endurance — ~32 minutes)
```bash
k6 run tests/k6/soak.js

# Shorter soak for quick leak detection
k6 run -e SOAK_DURATION=5m tests/k6/soak.js
```

## Override Config at Runtime

```bash
# Custom backend URL
k6 run -e BASE_URL=http://production.example.com tests/k6/load.js

# Custom credentials
k6 run \
  -e BASE_URL=http://localhost:8080 \
  -e ADMIN_EMAIL=myadmin@example.com \
  -e ADMIN_PASS=mypassword \
  tests/k6/load.js
```

## Output Formats

```bash
# Pretty terminal output (default)
k6 run tests/k6/smoke.js

# JSON output for CI/CD
k6 run --out json=results.json tests/k6/load.js

# HTML report (requires xk6-reporter)
k6 run --out web-dashboard tests/k6/load.js

# InfluxDB + Grafana
k6 run --out influxdb=http://localhost:8086/k6 tests/k6/load.js
```

## Thresholds

All tests enforce:
- **p(95) < 1500ms** — 95th percentile response time
- **p(99) < 3000ms** — 99th percentile response time  
- **Error rate < 1%** — HTTP failures
- **Check pass rate > 99%** — assertion pass rate

Stress test uses relaxed thresholds (p(95) < 3s, errors < 5%).

## Test Scenarios

| Test    | VUs Peak | Duration | Purpose |
|---------|----------|----------|---------|
| Smoke   | 1        | ~30s     | Sanity check — does the API respond? |
| Load    | 26       | 5m       | Validate performance at expected traffic |
| Stress  | 90       | 9m       | Find the breaking point |
| Soak    | 16       | 32m      | Detect memory leaks and gradual degradation |
