/**
 * HostelFixIT — Comprehensive k6 Load Test Suite
 *
 * This file covers ALL 4 types of performance tests:
 *   1. Smoke Test    — 1 VU for 30s   (Does the API even work?)
 *   2. Load Test     — Ramp to 50 VUs  (Can it handle expected traffic?)
 *   3. Stress Test   — Ramp to 200 VUs (Where does it break?)
 *   4. Spike Test    — Sudden burst    (Can it survive a traffic spike?)
 *
 * Usage:
 *   k6 run --env TEST_TYPE=smoke   k6-tests/full-test.js
 *   k6 run --env TEST_TYPE=load    k6-tests/full-test.js
 *   k6 run --env TEST_TYPE=stress  k6-tests/full-test.js
 *   k6 run --env TEST_TYPE=spike   k6-tests/full-test.js
 *
 * Prerequisites:
 *   - Backend running at BASE_URL (default: http://localhost:8080)
 *   - Seeded Admin account (admin@hocom.com / <your ADMIN_DEFAULT_PASSWORD>)
 */

import http from 'k6/http';
import { check, group, sleep, fail } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Configuration ──────────────────────────────────────────────────────────────

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@hocom.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin@123';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration', true);
const complaintCreateDuration = new Trend('complaint_create_duration', true);

// ─── Test Type Scenarios ────────────────────────────────────────────────────────

const testType = __ENV.TEST_TYPE || 'smoke';

const scenarios = {
  smoke: {
    stages: [
      { duration: '30s', target: 1 },   // 1 user for 30 seconds
    ],
    thresholds: {
      http_req_duration: ['p(99)<1500'],  // 99% of requests under 1.5s
      errors: ['rate<0.01'],              // Less than 1% errors
    },
  },
  load: {
    stages: [
      { duration: '1m', target: 10 },    // Ramp up to 10 users
      { duration: '3m', target: 50 },    // Ramp up to 50 users
      { duration: '2m', target: 50 },    // Stay at 50 users
      { duration: '1m', target: 0 },     // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<800', 'p(99)<1500'],
      errors: ['rate<0.05'],
    },
  },
  stress: {
    stages: [
      { duration: '1m', target: 20 },
      { duration: '2m', target: 50 },
      { duration: '2m', target: 100 },
      { duration: '2m', target: 150 },
      { duration: '3m', target: 200 },   // Push to 200 users
      { duration: '2m', target: 0 },     // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<2000'],
      errors: ['rate<0.15'],             // Allow up to 15% errors under extreme load
    },
  },
  spike: {
    stages: [
      { duration: '30s', target: 5 },    // Warm up
      { duration: '10s', target: 150 },  // SPIKE! 5 → 150 in 10 seconds
      { duration: '1m', target: 150 },   // Hold the spike
      { duration: '10s', target: 5 },    // Drop back down
      { duration: '1m', target: 5 },     // Recovery period
      { duration: '10s', target: 0 },    // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<3000'],
      errors: ['rate<0.20'],
    },
  },
};

const selectedScenario = scenarios[testType];

export const options = {
  stages: selectedScenario.stages,
  thresholds: {
    ...selectedScenario.thresholds,
    'login_duration': ['p(95)<1000'],
    'complaint_create_duration': ['p(95)<1500'],
  },
};

// ─── Helper Functions ───────────────────────────────────────────────────────────

const headers = { 'Content-Type': 'application/json' };

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function login(email, password) {
  const start = Date.now();
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers }
  );
  loginDuration.add(Date.now() - start);

  const success = check(res, {
    'login: status 200': (r) => r.status === 200,
    'login: has token': (r) => {
      try { return JSON.parse(r.body).token !== undefined; } catch { return false; }
    },
  });

  if (!success) {
    errorRate.add(1);
    return null;
  }

  errorRate.add(0);
  return JSON.parse(res.body).token;
}

// ─── Main Test Function ─────────────────────────────────────────────────────────

export default function () {

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  1. HEALTH & PUBLIC ENDPOINTS                                   ║
  // ╚══════════════════════════════════════════════════════════════════╝

  group('Health & Public', () => {
    const healthRes = http.get(`${BASE_URL}/actuator/health`);
    check(healthRes, {
      'health: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // Swagger docs endpoint
    const docsRes = http.get(`${BASE_URL}/v3/api-docs`);
    check(docsRes, {
      'swagger docs: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  sleep(0.5);

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  2. AUTHENTICATION FLOW                                         ║
  // ╚══════════════════════════════════════════════════════════════════╝

  let adminToken = null;

  group('Auth Flow', () => {
    // Login as Admin
    adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);
    if (!adminToken) {
      console.error('Admin login failed — skipping remaining tests');
      return;
    }

    // GET /api/auth/me
    const meRes = http.get(`${BASE_URL}/api/auth/me`, {
      headers: authHeaders(adminToken),
    });
    check(meRes, {
      'auth/me: status 200': (r) => r.status === 200,
      'auth/me: has role': (r) => {
        try { return JSON.parse(r.body).role !== undefined; } catch { return false; }
      },
    }) || errorRate.add(1);

    // Invalid login attempt
    const badLogin = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: 'fake@test.com', password: 'wrong' }),
      { headers }
    );
    check(badLogin, {
      'bad login: status 400': (r) => r.status === 400,
    }) || errorRate.add(1);
  });

  if (!adminToken) return;
  sleep(0.5);

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  3. ADMIN ENDPOINTS                                             ║
  // ╚══════════════════════════════════════════════════════════════════╝

  let createdHostelId = null;
  let createdStudentId = null;
  let createdWorkerId = null;
  let createdWardenId = null;

  group('Admin — Users', () => {
    const ah = authHeaders(adminToken);

    // List all users
    const usersRes = http.get(`${BASE_URL}/api/admin/users?page=0&size=5`, { headers: ah });
    check(usersRes, {
      'list users: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // Create a test hostel first
    const hostelBody = JSON.stringify({
      name: `K6-Hostel-${Date.now()}`,
      address: 'Load Test Block',
      capacity: 100,
    });
    const hostelRes = http.post(`${BASE_URL}/api/admin/hostels`, hostelBody, { headers: ah });
    check(hostelRes, {
      'create hostel: status 200/201': (r) => r.status === 200 || r.status === 201,
    }) || errorRate.add(1);

    try {
      createdHostelId = JSON.parse(hostelRes.body).id;
    } catch (_) {}

    if (!createdHostelId) return;

    // Create a student user
    const studentBody = JSON.stringify({
      name: `K6Student-${Date.now()}`,
      email: `k6student-${Date.now()}@test.com`,
      password: 'Test@1234',
      role: 'STUDENT',
      hostelId: createdHostelId,
    });
    const studentRes = http.post(`${BASE_URL}/api/admin/users`, studentBody, { headers: ah });
    check(studentRes, {
      'create student: status 200/201': (r) => r.status === 200 || r.status === 201,
    }) || errorRate.add(1);

    try {
      const parsed = JSON.parse(studentRes.body);
      createdStudentId = parsed.id;
    } catch (_) {}

    // Create a worker user
    const workerBody = JSON.stringify({
      name: `K6Worker-${Date.now()}`,
      email: `k6worker-${Date.now()}@test.com`,
      password: 'Test@1234',
      role: 'WORKER',
      hostelId: createdHostelId,
    });
    const workerRes = http.post(`${BASE_URL}/api/admin/users`, workerBody, { headers: ah });
    check(workerRes, {
      'create worker: status 200/201': (r) => r.status === 200 || r.status === 201,
    }) || errorRate.add(1);

    try {
      createdWorkerId = JSON.parse(workerRes.body).id;
    } catch (_) {}

    // Create a warden user
    const wardenBody = JSON.stringify({
      name: `K6Warden-${Date.now()}`,
      email: `k6warden-${Date.now()}@test.com`,
      password: 'Test@1234',
      role: 'WARDEN',
      hostelId: createdHostelId,
    });
    const wardenRes = http.post(`${BASE_URL}/api/admin/users`, wardenBody, { headers: ah });
    check(wardenRes, {
      'create warden: status 200/201': (r) => r.status === 200 || r.status === 201,
    }) || errorRate.add(1);

    try {
      createdWardenId = JSON.parse(wardenRes.body).id;
    } catch (_) {}
  });

  sleep(0.3);

  group('Admin — Hostels & Categories', () => {
    const ah = authHeaders(adminToken);

    // List hostels
    const hostelsRes = http.get(`${BASE_URL}/api/admin/hostels`, { headers: ah });
    check(hostelsRes, {
      'list hostels: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // List categories
    const catsRes = http.get(`${BASE_URL}/api/admin/categories`, { headers: ah });
    check(catsRes, {
      'list categories: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // Get all complaints (admin view)
    const complaintsRes = http.get(`${BASE_URL}/api/admin/complaints?page=0&size=5`, { headers: ah });
    check(complaintsRes, {
      'admin complaints: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  sleep(0.3);

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  4. STUDENT FLOW (Login → Profile → Create Complaint)           ║
  // ╚══════════════════════════════════════════════════════════════════╝

  let studentToken = null;
  let studentEmail = null;
  let createdComplaintId = null;

  group('Student Flow', () => {
    if (!createdStudentId) return;

    const ah = authHeaders(adminToken);
    const usersRes = http.get(`${BASE_URL}/api/admin/users?page=0&size=200`, { headers: ah });
    let foundEmail = null;
    try {
      const body = JSON.parse(usersRes.body);
      const users = body.content || body;
      if (Array.isArray(users)) {
        const student = users.find(u => u.id === createdStudentId);
        if (student) foundEmail = student.email;
      }
    } catch (_) {}

    if (!foundEmail) return;
    studentEmail = foundEmail;

    // Login as student
    studentToken = login(studentEmail, 'Test@1234');
    if (!studentToken) return;

    const sh = authHeaders(studentToken);

    // GET student profile
    const profileRes = http.get(`${BASE_URL}/api/student/profile`, { headers: sh });
    check(profileRes, {
      'student profile: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // GET categories (for complaint creation)
    const catsRes = http.get(`${BASE_URL}/api/student/categories`, { headers: sh });
    check(catsRes, {
      'student categories: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    let categoryId = null;
    try {
      const cats = JSON.parse(catsRes.body);
      if (Array.isArray(cats) && cats.length > 0) categoryId = cats[0].id;
    } catch (_) {}

    if (!categoryId) return;

    // Create a complaint
    const start = Date.now();
    const complaintBody = JSON.stringify({
      description: `K6 load test complaint — ${Date.now()}`,
      priority: 'MEDIUM',
      categoryId: categoryId,
    });
    const complaintRes = http.post(`${BASE_URL}/api/student/complaints`, complaintBody, { headers: sh });
    complaintCreateDuration.add(Date.now() - start);

    check(complaintRes, {
      'create complaint: status 200/201': (r) => r.status === 200 || r.status === 201,
    }) || errorRate.add(1);

    try {
      createdComplaintId = JSON.parse(complaintRes.body).id;
    } catch (_) {}

    // List my complaints
    const myComplaintsRes = http.get(`${BASE_URL}/api/student/complaints?page=0&size=5`, { headers: sh });
    check(myComplaintsRes, {
      'my complaints: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // Get complaint counts
    const countsRes = http.get(`${BASE_URL}/api/student/complaints/count`, { headers: sh });
    check(countsRes, {
      'student complaint counts: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  sleep(0.3);

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  5. WARDEN FLOW (Login → Assign Worker → Reject)                ║
  // ╚══════════════════════════════════════════════════════════════════╝

  let wardenToken = null;

  group('Warden Flow', () => {
    if (!createdWardenId || !createdComplaintId || !createdWorkerId) return;

    // Find warden email
    const ah = authHeaders(adminToken);
    const usersRes = http.get(`${BASE_URL}/api/admin/users?page=0&size=200`, { headers: ah });
    let wardenEmail = null;
    try {
      const body = JSON.parse(usersRes.body);
      const users = body.content || body;
      if (Array.isArray(users)) {
        const warden = users.find(u => u.id === createdWardenId);
        if (warden) wardenEmail = warden.email;
      }
    } catch (_) {}

    if (!wardenEmail) return;

    wardenToken = login(wardenEmail, 'Test@1234');
    if (!wardenToken) return;

    const wh = authHeaders(wardenToken);

    // GET warden profile
    const profileRes = http.get(`${BASE_URL}/api/warden/profile`, { headers: wh });
    check(profileRes, {
      'warden profile: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // List hostel complaints
    const complaintsRes = http.get(`${BASE_URL}/api/warden/complaints?page=0&size=5`, { headers: wh });
    check(complaintsRes, {
      'warden complaints: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // Assign worker to complaint
    const assignRes = http.put(
      `${BASE_URL}/api/warden/complaints/${createdComplaintId}/assign?workerId=${createdWorkerId}`,
      null,
      { headers: wh }
    );
    check(assignRes, {
      'assign worker: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // View hostel users
    const hostelUsersRes = http.get(`${BASE_URL}/api/warden/users?page=0&size=5`, { headers: wh });
    check(hostelUsersRes, {
      'warden hostel users: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  sleep(0.3);

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  6. WORKER FLOW (Login → View assigned → Start → Resolve)       ║
  // ╚══════════════════════════════════════════════════════════════════╝

  let workerToken = null;

  group('Worker Flow', () => {
    if (!createdWorkerId || !createdComplaintId) return;

    // Find worker email
    const ah = authHeaders(adminToken);
    const usersRes = http.get(`${BASE_URL}/api/admin/users?page=0&size=200`, { headers: ah });
    let workerEmail = null;
    try {
      const body = JSON.parse(usersRes.body);
      const users = body.content || body;
      if (Array.isArray(users)) {
        const worker = users.find(u => u.id === createdWorkerId);
        if (worker) workerEmail = worker.email;
      }
    } catch (_) {}

    if (!workerEmail) return;

    workerToken = login(workerEmail, 'Test@1234');
    if (!workerToken) return;

    const wkh = authHeaders(workerToken);

    // GET worker profile
    const profileRes = http.get(`${BASE_URL}/api/worker/profile`, { headers: wkh });
    check(profileRes, {
      'worker profile: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // List assigned complaints
    const complaintsRes = http.get(`${BASE_URL}/api/worker/complaints?page=0&size=5`, { headers: wkh });
    check(complaintsRes, {
      'worker complaints: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // Get worker complaint counts
    const countsRes = http.get(`${BASE_URL}/api/worker/complaints/count`, { headers: wkh });
    check(countsRes, {
      'worker complaint counts: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // Start progress on the complaint
    const startRes = http.put(
      `${BASE_URL}/api/worker/complaints/${createdComplaintId}/start`,
      null,
      { headers: wkh }
    );
    check(startRes, {
      'start progress: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // Resolve the complaint
    const resolveRes = http.put(
      `${BASE_URL}/api/worker/complaints/${createdComplaintId}/resolve`,
      null,
      { headers: wkh }
    );
    check(resolveRes, {
      'resolve complaint: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  sleep(0.3);

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  7. DASHBOARD                                                    ║
  // ╚══════════════════════════════════════════════════════════════════╝

  group('Dashboard', () => {
    // Admin dashboard
    const adminDash = http.get(`${BASE_URL}/api/dashboard/stats`, {
      headers: authHeaders(adminToken),
    });
    check(adminDash, {
      'admin dashboard: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // Warden dashboard
    if (wardenToken) {
      const wardenDash = http.get(`${BASE_URL}/api/dashboard/stats`, {
        headers: authHeaders(wardenToken),
      });
      check(wardenDash, {
        'warden dashboard: status 200': (r) => r.status === 200,
      }) || errorRate.add(1);
    }
  });

  sleep(0.3);

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  8. NOTIFICATIONS                                                ║
  // ╚══════════════════════════════════════════════════════════════════╝

  group('Notifications', () => {
    if (!studentToken) return;

    const sh = authHeaders(studentToken);

    // List notifications
    const notifRes = http.get(`${BASE_URL}/api/notifications`, { headers: sh });
    check(notifRes, {
      'list notifications: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // Unread count
    const unreadRes = http.get(`${BASE_URL}/api/notifications/unread-count`, { headers: sh });
    check(unreadRes, {
      'unread count: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // Mark all as read
    const markAllRes = http.put(`${BASE_URL}/api/notifications/mark-all-read`, null, { headers: sh });
    check(markAllRes, {
      'mark all read: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  sleep(0.3);

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  9. STUDENT FEEDBACK (after resolution)                          ║
  // ╚══════════════════════════════════════════════════════════════════╝

  group('Student Feedback', () => {
    if (!studentToken || !createdComplaintId) return;

    const sh = authHeaders(studentToken);

    const feedbackBody = JSON.stringify({
      complaintId: createdComplaintId,
      rating: 4,
      comment: 'K6 automated feedback — response was quick!',
    });

    const feedbackRes = http.post(`${BASE_URL}/api/student/feedback`, feedbackBody, { headers: sh });
    check(feedbackRes, {
      'submit feedback: status 200/201': (r) => r.status === 200 || r.status === 201,
    }) || errorRate.add(1);
  });

  sleep(0.3);

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  10. CLEANUP — Delete test data so k6 doesn't pollute the DB    ║
  // ╚══════════════════════════════════════════════════════════════════╝

  group('Cleanup', () => {
    const ah = authHeaders(adminToken);

    // Delete created users (complaint cascades should handle related data)
    if (createdStudentId) {
      http.del(`${BASE_URL}/api/admin/users/${createdStudentId}`, null, { headers: ah });
    }
    if (createdWorkerId) {
      http.del(`${BASE_URL}/api/admin/users/${createdWorkerId}`, null, { headers: ah });
    }
    if (createdWardenId) {
      http.del(`${BASE_URL}/api/admin/users/${createdWardenId}`, null, { headers: ah });
    }
    if (createdHostelId) {
      http.del(`${BASE_URL}/api/admin/hostels/${createdHostelId}`, null, { headers: ah });
    }

    // Logout
    http.post(`${BASE_URL}/api/auth/logout`, null, { headers: ah });
  });

  sleep(1);
}
