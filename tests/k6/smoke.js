/**
 * ╔══════════════════════════════════════════════╗
 * ║             SMOKE TEST                       ║
 * ║  1 VU · 1 iteration per role                 ║
 * ║  Purpose: Quick sanity check — "does it run?"║
 * ╚══════════════════════════════════════════════╝
 *
 * Usage:
 *   k6 run tests/k6/smoke.js
 *   k6 run -e BASE_URL=http://localhost:8080 tests/k6/smoke.js
 */

import { sleep } from "k6";
import { THRESHOLDS } from "./config.js";

import { authTests }       from "./modules/auth.js";
import { studentTests }    from "./modules/student.js";
import { wardenTests }     from "./modules/warden.js";
import { workerTests }     from "./modules/worker.js";
import { adminTests }      from "./modules/admin.js";
import { superadminTests } from "./modules/superadmin.js";

export const options = {
  // 1 virtual user, one complete pass through all roles
  vus: 1,
  iterations: 1,

  thresholds: {
    ...THRESHOLDS,
    // Smoke is more lenient — just make sure nothing crashes
    http_req_failed: ["rate<0.05"],
  },
};

export default function () {
  authTests();
  sleep(0.5);

  studentTests();
  sleep(0.5);

  wardenTests();
  sleep(0.5);

  workerTests();
  sleep(0.5);

  adminTests();
  sleep(0.5);

  superadminTests();
}
