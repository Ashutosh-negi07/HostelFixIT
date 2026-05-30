/**
 * ╔══════════════════════════════════════════════════════╗
 * ║               STRESS TEST                           ║
 * ║  Pushes beyond normal load to find breaking point.  ║
 * ║  Ramps aggressively to 3× normal traffic then holds.║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Usage:
 *   k6 run tests/k6/stress.js
 *   k6 run -e BASE_URL=http://localhost:8080 tests/k6/stress.js
 *
 * Expected duration: ~9 minutes
 * Watch: CPU usage, DB connections, heap size, GC pauses.
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
    students: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m",  target: 20  }, // ramp to normal
        { duration: "2m",  target: 40  }, // ramp to 2× normal
        { duration: "2m",  target: 50  }, // spike to max
        { duration: "2m",  target: 20  }, // recover
        { duration: "1m",  target: 0   }, // ramp down
      ],
      gracefulRampDown: "30s",
      exec: "runStudent",
    },

    wardens: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m",  target: 8  },
        { duration: "2m",  target: 15 },
        { duration: "2m",  target: 20 },
        { duration: "2m",  target: 8  },
        { duration: "1m",  target: 0  },
      ],
      gracefulRampDown: "30s",
      exec: "runWarden",
    },

    workers: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m",  target: 5  },
        { duration: "2m",  target: 10 },
        { duration: "2m",  target: 12 },
        { duration: "2m",  target: 5  },
        { duration: "1m",  target: 0  },
      ],
      gracefulRampDown: "30s",
      exec: "runWorker",
    },

    admins: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m",  target: 3 },
        { duration: "2m",  target: 6 },
        { duration: "2m",  target: 8 },
        { duration: "2m",  target: 3 },
        { duration: "1m",  target: 0 },
      ],
      gracefulRampDown: "30s",
      exec: "runAdmin",
    },
  },

  thresholds: {
    // Stress — allow slightly higher latency
    http_req_duration: ["p(95)<3000", "p(99)<5000"],
    http_req_failed:   ["rate<0.05"],
    checks:            ["rate>0.95"],
  },
};

export function runStudent() { studentTests(); sleep(0.5); }
export function runWarden()  { wardenTests();  sleep(0.5); }
export function runWorker()  { workerTests();  sleep(0.5); }
export function runAdmin()   { adminTests();   sleep(1);   }

export default function () {}
