/**
 * k6 Shared Helpers
 * ─────────────────────────────────────────
 * Reusable login/logout, request wrappers,
 * and assertion helpers for all test modules.
 */

import http from "k6/http";
import { check } from "k6";
import { BASE_URL, JSON_HEADERS, authHeaders } from "./config.js";

// ─── Auth ──────────────────────────────────────────────────────────────────

/**
 * Login with email + password. Returns the JWT token string.
 * Fails the check and returns null on error.
 */
export function login(email, password) {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers: JSON_HEADERS, tags: { name: "auth:login" } }
  );

  const ok = check(res, {
    "login: status 200": (r) => r.status === 200,
    "login: has token":  (r) => r.json("token") !== undefined,
  });

  if (!ok) {
    console.error(`Login failed for ${email}: ${res.status} ${res.body}`);
    return null;
  }

  return res.json("token");
}

/**
 * Logout — blacklists the current token on the server.
 */
export function logout(token) {
  const res = http.post(
    `${BASE_URL}/api/auth/logout`,
    null,
    { headers: authHeaders(token), tags: { name: "auth:logout" } }
  );
  check(res, { "logout: status 200": (r) => r.status === 200 });
}

// ─── Generic Request Wrappers ──────────────────────────────────────────────

export function GET(token, path, tag) {
  return http.get(`${BASE_URL}${path}`, {
    headers: authHeaders(token),
    tags: { name: tag || path },
  });
}

export function POST(token, path, body, tag) {
  return http.post(`${BASE_URL}${path}`, JSON.stringify(body), {
    headers: authHeaders(token),
    tags: { name: tag || path },
  });
}

export function PUT(token, path, body, tag) {
  return http.put(`${BASE_URL}${path}`, body !== undefined ? JSON.stringify(body) : null, {
    headers: authHeaders(token),
    tags: { name: tag || path },
  });
}

export function DEL(token, path, tag) {
  return http.del(`${BASE_URL}${path}`, null, {
    headers: authHeaders(token),
    tags: { name: tag || path },
  });
}

// ─── Assertion Helpers ─────────────────────────────────────────────────────

/** Assert response is 200 OK with JSON body */
export function assertOK(res, label) {
  return check(res, {
    [`${label}: status 200`]:  (r) => r.status === 200,
    [`${label}: has body`]:    (r) => r.body && r.body.length > 0,
  });
}

/** Assert response is 201 Created with JSON body */
export function assertCreated(res, label) {
  return check(res, {
    [`${label}: status 201`]: (r) => r.status === 201,
    [`${label}: has body`]:   (r) => r.body && r.body.length > 0,
  });
}

/** Assert paginated response has content array */
export function assertPaged(res, label) {
  return check(res, {
    [`${label}: status 200`]:    (r) => r.status === 200,
    [`${label}: has content`]:   (r) => Array.isArray(r.json("content")),
    [`${label}: has totalPages`]:(r) => r.json("totalPages") !== undefined,
  });
}

/** Extract first item ID from a paged response, or null */
export function firstId(res) {
  try {
    const items = res.json("content");
    return items && items.length > 0 ? items[0].id : null;
  } catch {
    return null;
  }
}
