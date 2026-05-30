/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║               SOAK TEST (Endurance)                     ║
 * ║  Runs at normal load for 30 minutes.                    ║
 * ║  Purpose: Detect memory leaks, DB connection exhaustion,║
 * ║           and gradual performance degradation.          ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   k6 run tests/k6/soak.js
 *   k6 run -e BASE_URL=http://localhost:8080 tests/k6/soak.js
 *   k6 run -e SOAK_DURATION=10m tests/k6/soak.js   # shorter run
 *
 * Expected duration: 32 minutes (configurable via SOAK_DURATION)
 */

import { sleep } from "k6";
import { THRESHOLDS } from "./config.js";

import { studentTests }    from "./modules/student.js";
import { wardenTests }     from "./modules/warden.js";
import { workerTests }     from "./modules/worker.js";
import { adminTests }      from "./modules/admin.js";

const SOAK_DURATION = __ENV.SOAK_DURATION || "30m";

export const options = {
  scenarios: {
    students: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m",           target: 10 },     // warm up
        { duration: SOAK_DURATION,  target: 10 },     // hold
        { duration: "1m",           target: 0  },     // cool down
      ],
      gracefulRampDown: "30s",
      exec: "runStudent",
    },

    wardens: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m",           target: 3 },
        { duration: SOAK_DURATION,  target: 3 },
        { duration: "1m",           target: 0 },
      ],
      gracefulRampDown: "30s",
      exec: "runWarden",
    },

    workers: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m",           target: 2 },
        { duration: SOAK_DURATION,  target: 2 },
        { duration: "1m",           target: 0 },
      ],
      gracefulRampDown: "30s",
      exec: "runWorker",
    },

    admins: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m",           target: 1 },
        { duration: SOAK_DURATION,  target: 1 },
        { duration: "1m",           target: 0 },
      ],
      gracefulRampDown: "30s",
      exec: "runAdmin",
    },
  },

  thresholds: {
    ...THRESHOLDS,
    // Soak — performance should not degrade over time
    "http_req_duration": ["p(95)<1500", "p(99)<3000"],
    // Watch for connection leaks via error rate staying near zero
    "http_req_failed":   ["rate<0.01"],
  },
};

export function runStudent() { studentTests(); sleep(2); }
export function runWarden()  { wardenTests();  sleep(2); }
export function runWorker()  { workerTests();  sleep(2); }
export function runAdmin()   { adminTests();   sleep(3); }

export default function () {}
