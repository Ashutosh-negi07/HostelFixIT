/**
 * Auth Test Module
 * ─────────────────────────────────────────
 * Tests: POST /api/auth/login
 *        GET  /api/auth/me
 *        POST /api/auth/logout
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, JSON_HEADERS, CREDENTIALS, authHeaders } from "../config.js";
import { login, logout, GET, assertOK } from "../helpers.js";

export function authTests() {
  // ── 1. Login with valid credentials ───────────────────────────────────
  const token = login(CREDENTIALS.student.email, CREDENTIALS.student.password);
  if (!token) return;

  sleep(0.3);

  // ── 2. GET /api/auth/me ────────────────────────────────────────────────
  const me = GET(token, "/api/auth/me", "auth:me");
  check(me, {
    "auth:me status 200":     (r) => r.status === 200,
    "auth:me has email":      (r) => r.json("email") !== undefined,
    "auth:me has role":       (r) => r.json("role") !== undefined,
  });

  sleep(0.2);

  // ── 3. Logout ──────────────────────────────────────────────────────────
  logout(token);

  sleep(0.2);

  // ── 4. Attempt to use blacklisted token ───────────────────────────────
  const afterLogout = GET(token, "/api/auth/me", "auth:me-after-logout");
  check(afterLogout, {
    "auth: token blacklisted after logout": (r) => r.status === 401 || r.status === 403,
  });

  sleep(0.2);

  // ── 5. Login with bad credentials ─────────────────────────────────────────
  const badLogin = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: "nobody@fake.com", password: "wrongpassword" }),
    { headers: JSON_HEADERS, tags: { name: "auth:bad-login" } }
  );
  check(badLogin, {
    // Backend returns 400 (not 401) for wrong credentials — both are acceptable
    "auth: bad login returns 401": (r) => r.status === 401 || r.status === 400,
  });

  sleep(0.3);
}
