/**
 * ╔══════════════════════════════════════════════════════╗
 * ║                LOAD TEST                            ║
 * ║  Simulates realistic production traffic.            ║
 * ║  Ramp up → Steady State → Ramp down                 ║
 * ║                                                     ║
 * ║  Distribution (matches real-world role ratios):     ║
 * ║    60% students  (most traffic)                     ║
 * ║    20% wardens                                      ║
 * ║    10% workers                                      ║
 * ║     5% admins                                       ║
 * ║     5% superadmins                                  ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Usage:
 *   k6 run tests/k6/load.js
 *   k6 run -e BASE_URL=http://localhost:8080 tests/k6/load.js
 *
 * Expected duration: ~5 minutes
 */

import { sleep } from "k6";
import { THRESHOLDS } from "./config.js";

import { studentTests }    from "./modules/student.js";
import { wardenTests }     from "./modules/warden.js";
import { workerTests }     from "./modules/worker.js";
import { adminTests }      from "./modules/admin.js";
import { superadminTests } from "./modules/superadmin.js";

export const options = {
  scenarios: {
    // ── Students (heaviest load) ──────────────────────────────────────
    students: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m",  target: 15 }, // ramp up
        { duration: "3m",  target: 15 }, // steady
        { duration: "1m",  target: 0  }, // ramp down
      ],
      gracefulRampDown: "30s",
      exec: "runStudent",
      tags: { role: "student" },
    },

    // ── Wardens ───────────────────────────────────────────────────────
    wardens: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m",  target: 5 },
        { duration: "3m",  target: 5 },
        { duration: "1m",  target: 0 },
      ],
      gracefulRampDown: "30s",
      exec: "runWarden",
      tags: { role: "warden" },
    },

    // ── Workers ───────────────────────────────────────────────────────
    workers: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m",  target: 3 },
        { duration: "3m",  target: 3 },
        { duration: "1m",  target: 0 },
      ],
      gracefulRampDown: "30s",
      exec: "runWorker",
      tags: { role: "worker" },
    },

    // ── Admins ────────────────────────────────────────────────────────
    admins: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m",  target: 2 },
        { duration: "3m",  target: 2 },
        { duration: "1m",  target: 0 },
      ],
      gracefulRampDown: "30s",
      exec: "runAdmin",
      tags: { role: "admin" },
    },

    // ── Super Admins ──────────────────────────────────────────────────
    superadmins: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m",  target: 1 },
        { duration: "3m",  target: 1 },
        { duration: "1m",  target: 0 },
      ],
      gracefulRampDown: "30s",
      exec: "runSuperAdmin",
      tags: { role: "superadmin" },
    },
  },

  thresholds: {
    ...THRESHOLDS,
    // Per-scenario thresholds using tags
    "http_req_duration{role:student}":     ["p(95)<1500"],
    "http_req_duration{role:warden}":      ["p(95)<1500"],
    "http_req_duration{role:worker}":      ["p(95)<1500"],
    "http_req_duration{role:admin}":       ["p(95)<2000"],
    "http_req_duration{role:superadmin}":  ["p(95)<2000"],
  },
};

export function runStudent()    { studentTests();    sleep(1); }
export function runWarden()     { wardenTests();     sleep(1); }
export function runWorker()     { workerTests();     sleep(1); }
export function runAdmin()      { adminTests();      sleep(2); }
export function runSuperAdmin() { superadminTests(); sleep(2); }

// Default export required by k6 (not used when scenarios define exec)
export default function () {}
