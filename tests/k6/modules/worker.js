/**
 * Worker Test Module
 * ─────────────────────────────────────────
 * Tests the full worker journey:
 *   Profile read/update
 *   Complaint counts
 *   Complaint list (assigned to this worker)
 *   Start Progress → Resolve flow (best-effort)
 *   Complaint detail + history
 */

import { check, sleep } from "k6";
import { CREDENTIALS } from "../config.js";
import {
  login, logout, GET, PUT, assertOK, assertPaged, firstId,
} from "../helpers.js";
import { BASE_URL } from "../config.js";
import http from "k6/http";

export function workerTests() {
  const token = login(CREDENTIALS.worker.email, CREDENTIALS.worker.password);
  if (!token) return;

  sleep(0.2);

  // ── Profile ────────────────────────────────────────────────────────────
  const profile = GET(token, "/api/worker/profile", "worker:profile");
  assertOK(profile, "worker:profile");
  check(profile, {
    "worker:profile role=WORKER": (r) => r.json("role") === "WORKER",
    "worker:profile has name":    (r) => r.json("name") !== undefined,
  });

  sleep(0.2);

  // ── Update Profile ─────────────────────────────────────────────────────
  const upd = PUT(
    token,
    "/api/worker/profile",
    { name: profile.json("name") || "Test Worker" },
    "worker:update-profile"
  );
  assertOK(upd, "worker:update-profile");

  sleep(0.2);

  // ── Complaint Counts ───────────────────────────────────────────────────
  const counts = GET(token, "/api/worker/complaints/count", "worker:complaint-count");
  assertOK(counts, "worker:complaint-count");
  check(counts, {
    "worker:counts has total":      (r) => r.json("total") !== undefined,
    "worker:counts has inProgress": (r) => r.json("inProgress") !== undefined,
  });

  sleep(0.2);

  // ── Complaint List ─────────────────────────────────────────────────────
  const list = GET(
    token,
    "/api/worker/complaints?page=0&size=10&sortBy=createdAt&order=asc",
    "worker:complaint-list"
  );
  assertPaged(list, "worker:complaint-list");

  sleep(0.2);

  // ── ASSIGNED complaints ────────────────────────────────────────────────
  // These may be empty if no complaints have been assigned to this worker yet
  const assigned = GET(
    token,
    "/api/worker/complaints?status=ASSIGNED&size=5",
    "worker:assigned-list"
  );
  check(assigned, {
    "worker:assigned-list status 200": (r) => r.status === 200,
    "worker:assigned-list has content": (r) => r.status === 200 && r.json("content") !== undefined,
    "worker:assigned-list has totalPages": (r) => r.status === 200 && r.json("totalPages") !== undefined,
  });

  sleep(0.2);

  // ── Start Progress on first ASSIGNED complaint (best-effort) ───────────
  const assignedId = firstId(assigned);
  if (assignedId) {
    const start = http.put(
      `${BASE_URL}/api/worker/complaints/${assignedId}/in-progress`,
      null,
      {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        tags: { name: "worker:start-progress" },
      }
    );
    check(start, {
      "worker:start-progress 200 or 400": (r) => r.status === 200 || r.status === 400,
    });

    sleep(0.2);
  }

  // ── IN_PROGRESS complaints → try resolve ──────────────────────────────
  // These may be empty if no complaints are in progress for this worker yet
  const inProgress = GET(
    token,
    "/api/worker/complaints?status=IN_PROGRESS&size=5",
    "worker:inprogress-list"
  );
  check(inProgress, {
    "worker:inprogress-list status 200": (r) => r.status === 200,
    "worker:inprogress-list has content": (r) => r.status === 200 && r.json("content") !== undefined,
    "worker:inprogress-list has totalPages": (r) => r.status === 200 && r.json("totalPages") !== undefined,
  });

  const inProgressId = firstId(inProgress);
  if (inProgressId) {
    const resolve = http.put(
      `${BASE_URL}/api/worker/complaints/${inProgressId}/resolve`,
      null,
      {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        tags: { name: "worker:resolve" },
      }
    );
    check(resolve, {
      "worker:resolve 200 or 400": (r) => r.status === 200 || r.status === 400,
    });

    sleep(0.2);
  }

  // ── Complaint Detail + History ─────────────────────────────────────────
  const anyId = firstId(list);
  if (anyId) {
    const detail = GET(
      token,
      `/api/worker/complaints/${anyId}`,
      "worker:complaint-detail"
    );
    assertOK(detail, "worker:complaint-detail");

    sleep(0.2);

    const history = GET(
      token,
      `/api/worker/complaints/${anyId}/history`,
      "worker:complaint-history"
    );
    check(history, {
      "worker:history 200 or 404": (r) => r.status === 200 || r.status === 404,
    });

    sleep(0.2);
  }

  sleep(0.3);

  logout(token);
}
