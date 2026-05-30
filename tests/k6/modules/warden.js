/**
 * Warden Test Module
 * ─────────────────────────────────────────
 * Tests the full warden journey:
 *   Profile read/update
 *   Complaint counts (new endpoint)
 *   Complaint list with filters
 *   Complaint detail + history
 *   Assign / Reject flow (best-effort)
 *   Students list
 *   Workers list
 */

import { check, sleep } from "k6";
import { CREDENTIALS } from "../config.js";
import {
  login, logout, GET, PUT, assertOK, assertPaged, firstId,
} from "../helpers.js";
import { BASE_URL } from "../config.js";
import http from "k6/http";

export function wardenTests() {
  const token = login(CREDENTIALS.warden.email, CREDENTIALS.warden.password);
  if (!token) return;

  sleep(0.2);

  // ── Profile ────────────────────────────────────────────────────────────
  const profile = GET(token, "/api/warden/profile", "warden:profile");
  assertOK(profile, "warden:profile");
  check(profile, {
    "warden:profile role=WARDEN": (r) => r.json("role") === "WARDEN",
  });

  sleep(0.2);

  // ── Update Profile ─────────────────────────────────────────────────────
  const upd = PUT(
    token,
    "/api/warden/profile",
    { name: profile.json("name") || "Test Warden" },
    "warden:update-profile"
  );
  assertOK(upd, "warden:update-profile");

  sleep(0.2);

  // ── Complaint Counts ───────────────────────────────────────────────────
  const counts = GET(token, "/api/warden/complaints/count", "warden:complaint-count");
  assertOK(counts, "warden:complaint-count");
  check(counts, {
    "warden:counts has pending": (r) => r.json("pending") !== undefined,
    "warden:counts has total":   (r) => r.json("total") !== undefined,
  });

  sleep(0.2);

  // ── Complaint List ─────────────────────────────────────────────────────
  const list = GET(
    token,
    "/api/warden/complaints?page=0&size=10&sortBy=createdAt&order=desc",
    "warden:complaint-list"
  );
  assertPaged(list, "warden:complaint-list");

  sleep(0.2);

  // ── Pending complaints ─────────────────────────────────────────────────
  const pending = GET(
    token,
    "/api/warden/complaints?status=PENDING&size=5",
    "warden:pending-list"
  );
  assertPaged(pending, "warden:pending-list");

  sleep(0.2);

  // ── Complaint Detail + History ─────────────────────────────────────────
  const anyId = firstId(list);
  if (anyId) {
    const detail = GET(
      token,
      `/api/warden/complaints/${anyId}`,
      "warden:complaint-detail"
    );
    // 404 is valid — complaint may have been cancelled by student between list fetch and detail fetch
    check(detail, {
      "warden:complaint-detail 200 or 404": (r) => r.status === 200 || r.status === 404,
    });

    sleep(0.2);

    const history = GET(
      token,
      `/api/warden/complaints/${anyId}/history`,
      "warden:complaint-history"
    );
    check(history, {
      "warden:history 200 or 404": (r) => r.status === 200 || r.status === 404,
    });

    sleep(0.2);
  }

  // ── Workers list (for assign dropdown) ────────────────────────────────
  const workers = GET(
    token,
    "/api/warden/workers?size=20",
    "warden:workers"
  );
  assertPaged(workers, "warden:workers");

  sleep(0.2);

  // ── Assign a worker to first pending complaint (best-effort) ───────────
  const pendingId = firstId(pending);
  const workerId  = firstId(workers);
  if (pendingId && workerId) {
    const assign = http.put(
      `${BASE_URL}/api/warden/complaints/${pendingId}/assign`,
      JSON.stringify({ workerId }),
      {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        tags: { name: "warden:assign" },
      }
    );
    check(assign, {
      // 200 = assigned, 400 = business rule, 404 = complaint cancelled by student before assign
      "warden:assign 200 or 400 or 404": (r) => r.status === 200 || r.status === 400 || r.status === 404,
    });

    sleep(0.2);
  }

  // ── Students list ──────────────────────────────────────────────────────
  const students = GET(
    token,
    "/api/warden/students?size=10",
    "warden:students"
  );
  assertPaged(students, "warden:students");

  sleep(0.2);

  // ── Dashboard stats ────────────────────────────────────────────────────
  const stats = GET(token, "/api/dashboard/stats", "warden:dashboard-stats");
  assertOK(stats, "warden:dashboard-stats");

  sleep(0.3);

  logout(token);
}
