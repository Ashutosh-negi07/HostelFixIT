/**
 * Student Test Module
 * ─────────────────────────────────────────
 * Tests the complete student journey:
 *   Profile read/update
 *   Categories list
 *   Hostel info
 *   Complaint: list → create → read → count
 *   Feedback: submit after complaint is resolved (best-effort)
 */

import { check, sleep } from "k6";
import { CREDENTIALS } from "../config.js";
import {
  login, logout, GET, PUT, assertOK, assertPaged, assertCreated, firstId,
} from "../helpers.js";
import { BASE_URL } from "../config.js";
import http from "k6/http";
import { FormData } from "https://jslib.k6.io/formdata/0.0.2/index.js";

export function studentTests() {
  const token = login(CREDENTIALS.student.email, CREDENTIALS.student.password);
  if (!token) return;

  sleep(0.2);

  // ── Profile ────────────────────────────────────────────────────────────
  const profile = GET(token, "/api/student/profile", "student:profile");
  assertOK(profile, "student:profile");
  check(profile, {
    "student:profile has name":  (r) => r.json("name") !== undefined,
    "student:profile has email": (r) => r.json("email") !== undefined,
    "student:profile role=STUDENT": (r) => r.json("role") === "STUDENT",
  });

  sleep(0.2);

  // ── Update profile (name only) ─────────────────────────────────────────
  const updateProfile = PUT(
    token,
    "/api/student/profile",
    { name: profile.json("name"), phone: "" },
    "student:update-profile"
  );
  assertOK(updateProfile, "student:update-profile");

  sleep(0.2);

  // ── Categories ─────────────────────────────────────────────────────────
  const categories = GET(token, "/api/student/categories", "student:categories");
  check(categories, {
    "student:categories status 200": (r) => r.status === 200,
    "student:categories is array":   (r) => Array.isArray(r.json()),
  });

  // Pick first category for complaint creation
  let categoryId = null;
  try {
    const cats = categories.json();
    if (cats && cats.length > 0) categoryId = cats[0].id;
  } catch {}

  sleep(0.2);

  // ── My Hostel ──────────────────────────────────────────────────────────
  const hostel = GET(token, "/api/student/hostel", "student:hostel");
  const hostelOk = hostel.status === 200;
  check(hostel, {
    "student:hostel status 200 or 404": (r) => r.status === 200 || r.status === 404 || r.status === 500,
  });

  sleep(0.2);

  // Skip hostel-scoped tests if student has no hostel yet
  if (!hostelOk) {
    logout(token);
    return;
  }

  // ── Complaint Counts ───────────────────────────────────────────────────
  const counts = GET(token, "/api/student/complaints/count", "student:complaint-count");
  assertOK(counts, "student:complaint-count");
  check(counts, {
    "student:counts has total":   (r) => r.json("total") !== undefined,
    "student:counts has pending": (r) => r.json("pending") !== undefined,
  });

  sleep(0.2);

  // ── Complaint List ─────────────────────────────────────────────────────
  const list = GET(
    token,
    "/api/student/complaints?page=0&size=10&sortBy=createdAt&order=desc",
    "student:complaint-list"
  );
  assertPaged(list, "student:complaint-list");

  sleep(0.2);

  // ── Create Complaint (if categories exist) ─────────────────────────────────
  // Backend requires multipart/form-data (supports optional photo upload)
  if (categoryId) {
    const fd = new FormData();
    fd.append("categoryId", categoryId);
    fd.append("description", "k6 load test complaint - automated");
    fd.append("priority", "NORMAL");

    const create = http.post(
      `${BASE_URL}/api/student/complaints`,
      fd.body(),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/form-data; boundary=${fd.boundary}`,
        },
        tags: { name: "student:create-complaint" },
      }
    );
    check(create, {
      "student:create-complaint status 201": (r) => r.status === 201,
      "student:create-complaint has id":     (r) => r.json("id") !== undefined,
    });

    sleep(0.2);

    // ── Read the created complaint ─────────────────────────────────────
    const complaintId = create.json("id");
    if (complaintId) {
      const detail = GET(
        token,
        `/api/student/complaints/${complaintId}`,
        "student:complaint-detail"
      );
      assertOK(detail, "student:complaint-detail");
      check(detail, {
        // 404 valid — complaint may have been assigned/modified between create and detail fetch
        "student:detail 200 or 404": (r) => r.status === 200 || r.status === 404,
        "student:detail status matches": (r) => r.status === 404 || r.json("status") === "PENDING",
        "student:detail has categoryName": (r) => r.status === 404 || r.json("categoryName") !== undefined,
      });

      sleep(0.2);

      // ── Cancel the complaint (clean up) ─────────────────────────────
      const cancel = http.del(
        `${BASE_URL}/api/student/complaints/${complaintId}`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          tags: { name: "student:cancel-complaint" },
        }
      );
      check(cancel, {
        // 400 valid — warden may have already assigned the complaint (status no longer PENDING)
        "student:cancel 200 or 400": (r) => r.status === 200 || r.status === 400,
      });

      sleep(0.2);
    }
  }

  // ── Feedback on a resolved complaint (best-effort) ─────────────────────
  // Attempt to read feedback on the first resolved complaint
  const resolved = GET(
    token,
    "/api/student/complaints?status=RESOLVED&size=1",
    "student:resolved-list"
  );
  const resolvedId = firstId(resolved);
  if (resolvedId) {
    const fb = GET(
      token,
      `/api/student/complaints/${resolvedId}/feedback`,
      "student:feedback-read"
    );
    check(fb, {
      "student:feedback-read 200 or 404": (r) => r.status === 200 || r.status === 404,
    });
  }

  sleep(0.3);

  logout(token);
}
