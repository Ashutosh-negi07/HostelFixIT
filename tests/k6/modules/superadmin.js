/**
 * Super Admin Test Module
 * ─────────────────────────────────────────
 * Tests the super admin journey:
 *   Profile read/update
 *   Global stats
 *   Admin CRUD + toggle
 *   Hostel CRUD + assign/unassign
 *   Notifications
 */

import { check, sleep } from "k6";
import { CREDENTIALS } from "../config.js";
import {
  login, logout, GET, POST, PUT, DEL, assertOK, assertPaged, assertCreated, firstId,
} from "../helpers.js";
import { BASE_URL } from "../config.js";
import http from "k6/http";

export function superadminTests() {
  const token = login(CREDENTIALS.superadmin.email, CREDENTIALS.superadmin.password);
  if (!token) return;

  sleep(0.2);

  // ── Profile ────────────────────────────────────────────────────────────
  const profile = GET(token, "/api/superadmin/me", "sa:profile");
  assertOK(profile, "sa:profile");
  check(profile, {
    "sa:profile role=SUPER_ADMIN": (r) => r.json("role") === "SUPER_ADMIN",
  });

  sleep(0.2);

  // ── Update Profile ─────────────────────────────────────────────────────
  const upd = PUT(
    token,
    "/api/superadmin/me",
    { name: profile.json("name") || "Super Admin" },
    "sa:update-profile"
  );
  assertOK(upd, "sa:update-profile");

  sleep(0.2);

  // ── Global Stats ───────────────────────────────────────────────────────
  const stats = GET(token, "/api/superadmin/stats", "sa:global-stats");
  assertOK(stats, "sa:global-stats");
  check(stats, {
    "sa:stats has totalAdmins":   (r) => r.json("totalAdmins") !== undefined,
    "sa:stats has totalHostels":  (r) => r.json("totalHostels") !== undefined,
    "sa:stats has totalStudents": (r) => r.json("totalStudents") !== undefined,
  });

  sleep(0.2);

  // ── Admins List ────────────────────────────────────────────────────────
  const admins = GET(
    token,
    "/api/superadmin/admins?page=0&size=10",
    "sa:admins-list"
  );
  assertPaged(admins, "sa:admins-list");

  sleep(0.2);

  // ── Create Admin (then cleanup) ────────────────────────────────────────
  const ts = Date.now();
  const newAdmin = POST(
    token,
    "/api/superadmin/admins",
    {
      name: `k6-admin-${ts}`,
      email: `k6admin${ts}@hostelfixit.com`,
      password: "k6testpass123",
      role: "ADMIN",
    },
    "sa:create-admin"
  );
  assertCreated(newAdmin, "sa:create-admin");

  const adminId = newAdmin.json("user") ? newAdmin.json("user.id") : newAdmin.json("id");

  sleep(0.2);

  if (adminId) {
    // Update admin
    const updAdmin = PUT(
      token,
      `/api/superadmin/admins/${adminId}`,
      { name: `k6-admin-upd-${ts}` },
      "sa:update-admin"
    );
    assertOK(updAdmin, "sa:update-admin");

    sleep(0.2);

    // Toggle (disable)
    const toggle = http.patch(
      `${BASE_URL}/api/superadmin/admins/${adminId}/toggle`,
      null,
      {
        headers: { Authorization: `Bearer ${token}` },
        tags: { name: "sa:toggle-admin" },
      }
    );
    check(toggle, {
      "sa:toggle-admin 200": (r) => r.status === 200,
    });

    sleep(0.2);

    // Delete admin (cleanup)
    const del = DEL(token, `/api/superadmin/admins/${adminId}`, "sa:delete-admin");
    check(del, {
      "sa:delete-admin 200": (r) => r.status === 200,
    });

    sleep(0.2);
  }

  // ── Hostels (Global) ───────────────────────────────────────────────────
  const hostels = GET(
    token,
    "/api/superadmin/hostels?page=0&size=10",
    "sa:hostels-list"
  );
  check(hostels, {
    "sa:hostels 200": (r) => r.status === 200,
  });

  sleep(0.2);

  // Create Hostel
  const newHostel = POST(
    token,
    "/api/superadmin/hostels",
    { name: `k6-hostel-${ts}`, address: "123 k6 Load Test Road" },
    "sa:create-hostel"
  );
  assertCreated(newHostel, "sa:create-hostel");

  const hostelId = newHostel.json("id");

  sleep(0.2);

  if (hostelId) {
    // Unassign (idempotent since no admin assigned)
    const unassign = http.put(
      `${BASE_URL}/api/superadmin/hostels/${hostelId}/unassign`,
      null,
      {
        headers: { Authorization: `Bearer ${token}` },
        tags: { name: "sa:unassign-hostel" },
      }
    );
    check(unassign, {
      "sa:unassign 200 or 400": (r) => r.status === 200 || r.status === 400,
    });

    sleep(0.2);

    // Delete hostel (cleanup)
    const delHostel = DEL(
      token,
      `/api/superadmin/hostels/${hostelId}`,
      "sa:delete-hostel"
    );
    check(delHostel, {
      "sa:delete-hostel 200": (r) => r.status === 200,
    });

    sleep(0.2);
  }

  // ── Notifications ──────────────────────────────────────────────────────
  const notifs = GET(
    token,
    "/api/notifications?page=0&size=10",
    "sa:notifications"
  );
  assertPaged(notifs, "sa:notifications");

  sleep(0.3);

  logout(token);
}
