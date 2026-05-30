/**
 * k6 Shared Configuration
 * ─────────────────────────────────────────
 * Central place for base URL, credentials,
 * and shared thresholds used across all tests.
 *
 * Override BASE_URL at runtime:
 *   k6 run -e BASE_URL=http://localhost:8080 smoke.js
 */

export const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

// ─── Test Credentials ──────────────────────────────────────────────────────
// Matches the accounts created by seed.js at the project root.
// Override any credential at runtime: k6 run -e ADMIN_EMAIL=x -e ADMIN_PASS=y
export const CREDENTIALS = {
  superadmin: {
    email: __ENV.SA_EMAIL     || "superadmin@hostelfixit.com",
    password: __ENV.SA_PASS   || "SuperAdmin@123",
  },
  admin: {
    email: __ENV.ADMIN_EMAIL  || "admin@hocom.com",
    password: __ENV.ADMIN_PASS || "Admin@123",
  },
  warden: {
    // seed.js creates 3 wardens; we use the first one
    email: __ENV.WARDEN_EMAIL || "warden.sunrise@hostelfixit.com",
    password: __ENV.WARDEN_PASS || "Warden@123",
  },
  worker: {
    // seed.js creates 6 workers; we use the first one
    email: __ENV.WORKER_EMAIL || "worker1.sunrise@hostelfixit.com",
    password: __ENV.WORKER_PASS || "Worker@123",
  },
  student: {
    email: __ENV.STUDENT_EMAIL || "aarav@student.com",
    password: __ENV.STUDENT_PASS || "Student@123",
  },
};

// ─── Shared Thresholds ─────────────────────────────────────────────────────
// Applied to every test runner unless overridden.
export const THRESHOLDS = {
  // 95% of requests must complete below 1.5 s
  http_req_duration: ["p(95)<1500", "p(99)<3000"],
  // Error rate must stay below 1%
  http_req_failed: ["rate<0.01"],
  // Checks pass rate > 99%
  checks: ["rate>0.99"],
};

// ─── HTTP Default Params ───────────────────────────────────────────────────
export const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}
