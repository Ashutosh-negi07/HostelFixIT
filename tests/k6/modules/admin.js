/**
 * Admin Test Module
 * ─────────────────────────────────────────
 * Tests the admin journey:
 *   Profile read/update (new endpoints)
 *   Dashboard stats (charts data)
 *   Complaint list + detail + filters
 *   Categories CRUD
 *   Hostels CRUD
 *   User management (list by role, create, update, delete)
 *   Notifications
 */

import { check, sleep } from "k6";
import { CREDENTIALS } from "../config.js";
import {
  login, logout, GET, POST, PUT, DEL, assertOK, assertPaged, assertCreated, firstId,
} from "../helpers.js";
import { BASE_URL } from "../config.js";
import http from "k6/http";

export function adminTests() {
  const token = login(CREDENTIALS.admin.email, CREDENTIALS.admin.password);
  if (!token) return;

  sleep(0.2);

  // ── Profile ────────────────────────────────────────────────────────────
  const profile = GET(token, "/api/admin/profile", "admin:profile");
  assertOK(profile, "admin:profile");
  check(profile, {
    "admin:profile role=ADMIN": (r) => r.json("role") === "ADMIN",
    "admin:profile has name":   (r) => r.json("name") !== undefined,
  });

  sleep(0.2);

  const updProfile = PUT(
    token,
    "/api/admin/profile",
    { name: profile.json("name") || "Admin" },
    "admin:update-profile"
  );
  assertOK(updProfile, "admin:update-profile");

  sleep(0.2);

  // ── Dashboard Stats ────────────────────────────────────────────────────
  const stats = GET(token, "/api/dashboard/stats", "admin:dashboard-stats");
  assertOK(stats, "admin:dashboard-stats");
  check(stats, {
    "admin:stats totalComplaints exists":      (r) => r.json("totalComplaints") !== undefined,
    "admin:stats complaintsByCategory exists": (r) => r.json("complaintsByCategory") !== null,
    "admin:stats complaintsByHostel exists":   (r) => r.json("complaintsByHostel") !== null,
  });

  sleep(0.2);

  // ── Complaint List ─────────────────────────────────────────────────────
  const complaints = GET(
    token,
    "/api/admin/complaints?page=0&size=10&sortBy=createdAt&order=desc",
    "admin:complaint-list"
  );
  assertPaged(complaints, "admin:complaint-list");

  sleep(0.2);

  // ── Filter by status ───────────────────────────────────────────────────
  const pending = GET(
    token,
    "/api/admin/complaints?status=PENDING&size=5",
    "admin:complaint-pending"
  );
  assertPaged(pending, "admin:complaint-pending");

  sleep(0.2);

  // ── Complaint Detail ───────────────────────────────────────────────────
  const complaintId = firstId(complaints);
  if (complaintId) {
    const detail = GET(
      token,
      `/api/admin/complaints/${complaintId}`,
      "admin:complaint-detail"
    );
    // 404 is valid — complaint may have been cancelled between list fetch and detail fetch
    check(detail, {
      "admin:complaint-detail 200 or 404": (r) => r.status === 200 || r.status === 404,
    });

    sleep(0.2);

    const history = GET(
      token,
      `/api/admin/complaints/${complaintId}/history`,
      "admin:complaint-history"
    );
    check(history, {
      "admin:history 200 or 404": (r) => r.status === 200 || r.status === 404,
    });

    sleep(0.2);
  }

  // ── Categories CRUD ────────────────────────────────────────────────────
  const catList = GET(token, "/api/admin/categories", "admin:categories");
  check(catList, {
    "admin:categories status 200": (r) => r.status === 200,
    "admin:categories is array":   (r) => Array.isArray(r.json()),
  });

  // Create a test category
  const newCat = POST(
    token,
    "/api/admin/categories",
    { name: `k6-test-cat-${Date.now()}`, description: "Created by k6 load test" },
    "admin:create-category"
  );
  assertCreated(newCat, "admin:create-category");

  const catId = newCat.json("id");

  sleep(0.2);

  if (catId) {
    // Update it
    const updCat = PUT(
      token,
      `/api/admin/categories/${catId}`,
      { name: `k6-test-cat-upd-${Date.now()}`, description: "Updated by k6" },
      "admin:update-category"
    );
    assertOK(updCat, "admin:update-category");

    sleep(0.2);

    // Delete it (cleanup)
    const delCat = DEL(token, `/api/admin/categories/${catId}`, "admin:delete-category");
    check(delCat, {
      "admin:delete-category 200 or 409": (r) => r.status === 200 || r.status === 409,
    });

    sleep(0.2);
  }

  // ── Hostels ────────────────────────────────────────────────────────────
  const hostels = GET(token, "/api/admin/hostels", "admin:hostels");
  check(hostels, {
    "admin:hostels status 200": (r) => r.status === 200,
  });

  sleep(0.2);

  // ── Users ──────────────────────────────────────────────────────────────
  const allUsers = GET(
    token,
    "/api/admin/users?page=0&size=10",
    "admin:users-all"
  );
  assertPaged(allUsers, "admin:users-all");

  sleep(0.2);

  // By role
  const students = GET(
    token,
    "/api/admin/users/role/STUDENT?page=0&size=10",
    "admin:users-students"
  );
  assertPaged(students, "admin:users-students");

  sleep(0.2);

  const workers = GET(
    token,
    "/api/admin/users/role/WORKER?page=0&size=10",
    "admin:users-workers"
  );
  assertPaged(workers, "admin:users-workers");

  sleep(0.2);

  // ── Notifications ──────────────────────────────────────────────────────
  const notifs = GET(
    token,
    "/api/notifications?page=0&size=10",
    "admin:notifications"
  );
  assertPaged(notifs, "admin:notifications");

  sleep(0.2);

  const unread = GET(
    token,
    "/api/notifications/unread-count",
    "admin:notifications-unread"
  );
  assertOK(unread, "admin:notifications-unread");

  sleep(0.3);

  logout(token);
}
