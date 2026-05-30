#!/usr/bin/env node
/**
 * HostelFixIT — Full Reseed v3
 * Creates: 3 Hostels, 3 Wardens, 6 Workers, 15 Students, ~50 Complaints (all statuses)
 */

const BASE           = "http://localhost:8080";
const ADMIN_EMAIL    = "admin@hocom.com";
const ADMIN_PASSWORD = "Admin@123";
const SUPER_EMAIL    = "superadmin@hostelfixit.com";
const FETCH_TIMEOUT  = 15000; // 15s per request

let adminToken = "";

// ── helpers ───────────────────────────────────────────────────────────────────

function withTimeout(promise, ms = FETCH_TIMEOUT) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`Timeout after ${ms}ms`)), ms)),
  ]);
}

async function req(method, path, body, token, isMultipart = false) {
  const headers = {};
  if (!isMultipart) headers["Content-Type"] = "application/json";
  if (token || adminToken) headers["Authorization"] = `Bearer ${token || adminToken}`;
  try {
    const res = await withTimeout(fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? (isMultipart ? body : JSON.stringify(body)) : undefined,
    }));
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    if (!res.ok && res.status !== 404 && res.status !== 409) {
      console.warn(`  ⚠  ${method} ${path} → ${res.status}:`,
        typeof data === "object" ? (data.message || data.error || JSON.stringify(data).slice(0, 100)) : String(data).slice(0, 100));
      return null;
    }
    return data;
  } catch (e) {
    console.warn(`  ✗  ${method} ${path} → ${e.message}`);
    return null;
  }
}

async function login(email, password) {
  try {
    const res = await withTimeout(fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }));
    const d = await res.json();
    return d.token || null;
  } catch (e) {
    console.warn(`  ✗  login(${email}) → ${e.message}`);
    return null;
  }
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));
function log(msg) { console.log(`\n${"─".repeat(60)}\n${msg}`); }
function ok(l, v)  { console.log(`  ✓  ${l}:`, v !== undefined ? v : "done"); }
function info(msg) { console.log(`  ·  ${msg}`); }

// ── static data ───────────────────────────────────────────────────────────────

const HOSTELS = [
  { name: "Sunrise Residency",   address: "Block A, North Campus, Sector 12" },
  { name: "Bluebell Boys PG",    address: "Block B, South Campus, Sector 7"  },
  { name: "Green Valley Hostel", address: "Block C, East Campus, Sector 21"  },
];

const WARDENS = [
  { name: "Ankit Sharma", email: "warden.sunrise@hostelfixit.com",  password: "Warden@123", phone: 9876540101 },
  { name: "Pooja Mehta",  email: "warden.bluebell@hostelfixit.com", password: "Warden@123", phone: 9876540102 },
  { name: "Ramesh Iyer",  email: "warden.valley@hostelfixit.com",   password: "Warden@123", phone: 9876540103 },
];

const WORKERS = [
  { name: "Manoj Tiwari", email: "worker1.sunrise@hostelfixit.com",  password: "Worker@123", phone: 9876541001 },
  { name: "Suresh Pal",   email: "worker2.sunrise@hostelfixit.com",  password: "Worker@123", phone: 9876541002 },
  { name: "Vijay Nair",   email: "worker1.bluebell@hostelfixit.com", password: "Worker@123", phone: 9876541003 },
  { name: "Ravi Dubey",   email: "worker2.bluebell@hostelfixit.com", password: "Worker@123", phone: 9876541004 },
  { name: "Deepak Gupta", email: "worker1.valley@hostelfixit.com",   password: "Worker@123", phone: 9876541005 },
  { name: "Amit Yadav",   email: "worker2.valley@hostelfixit.com",   password: "Worker@123", phone: 9876541006 },
];

const STUDENTS = [
  { name: "Aarav Mehta",    email: "aarav@student.com",   password: "Student@123", phone: 9876550001 },
  { name: "Priya Singh",    email: "priya@student.com",   password: "Student@123", phone: 9876550002 },
  { name: "Dev Kapoor",     email: "dev@student.com",     password: "Student@123", phone: 9876550003 },
  { name: "Sneha Roy",      email: "sneha@student.com",   password: "Student@123", phone: 9876550004 },
  { name: "Arjun Das",      email: "arjun@student.com",   password: "Student@123", phone: 9876550005 },
  { name: "Rahul Joshi",    email: "rahul@student.com",   password: "Student@123", phone: 9876550006 },
  { name: "Kavya Reddy",    email: "kavya@student.com",   password: "Student@123", phone: 9876550007 },
  { name: "Nikhil Rao",     email: "nikhil@student.com",  password: "Student@123", phone: 9876550008 },
  { name: "Ananya Bose",    email: "ananya@student.com",  password: "Student@123", phone: 9876550009 },
  { name: "Ishaan Verma",   email: "ishaan@student.com",  password: "Student@123", phone: 9876550010 },
  { name: "Tanvi Patil",    email: "tanvi@student.com",   password: "Student@123", phone: 9876550011 },
  { name: "Rohan Kulkarni", email: "rohan@student.com",   password: "Student@123", phone: 9876550012 },
  { name: "Meera Nambiar",  email: "meera@student.com",   password: "Student@123", phone: 9876550013 },
  { name: "Karan Shah",     email: "karan@student.com",   password: "Student@123", phone: 9876550014 },
  { name: "Divya Menon",    email: "divya@student.com",   password: "Student@123", phone: 9876550015 },
];

const DESCS = [
  "Bathroom tap leaking since last week, water wasting continuously.",
  "Electric socket near bed sparking when anything is plugged in.",
  "Room not cleaned in 4 days. Dustbin overflowing with garbage.",
  "Study table chair broken, one leg snapped off. Cannot sit and study.",
  "WiFi router on floor 2 not working for 2 days. No internet.",
  "Main gate lock broken, anyone can enter at night. Security risk.",
  "Water heater in bathroom not working. No hot water for bathing.",
  "Ceiling fan making loud noise and vibrating heavily. Unsafe.",
  "Common bathroom tiles cracked and slippery, risk of injury.",
  "Corridor light not working for 3 days. Very dark at night.",
  "Room window latch broken, cannot close it properly.",
  "Drainage in bathroom blocked, water accumulating on floor.",
  "Power cut every evening 6-8 PM in block C.",
  "Cockroaches found in kitchen area, needs pest control urgently.",
  "Almirah lock broken, cannot secure belongings.",
  "Water supply irregular, no water after 10 AM.",
  "Mosquito mesh on window torn, mosquitoes entering room.",
  "Table lamp socket not working, cannot study at night.",
  "Hostel gate CCTV camera not recording since last week.",
  "Mattress torn and very uncomfortable, springs poking out.",
  "Water cooler on ground floor dispensing warm water.",
  "Room door does not close properly. Security issue.",
  "Switch board in corridor burnt and smells like burning.",
  "Dust accumulation on ceiling fan, needs thorough cleaning.",
  "Exhaust fan in bathroom not working, very humid.",
  "Notice board in corridor damaged and falling apart.",
  "Geyser taking too long to heat, seems broken.",
  "Pipe under bathroom sink dripping, small puddle forming.",
];

// complaint plans: si=studentIdx, ci=categoryIdx, di=descIdx
const PLANS = [
  // PENDING (4)
  { si:0,  status:"PENDING",     priority:"HIGH",   ci:0, di:0  },
  { si:1,  status:"PENDING",     priority:"NORMAL", ci:2, di:2  },
  { si:2,  status:"PENDING",     priority:"LOW",    ci:4, di:4  },
  { si:3,  status:"PENDING",     priority:"HIGH",   ci:5, di:5  },
  // ASSIGNED (4)
  { si:4,  status:"ASSIGNED",    priority:"HIGH",   ci:0, di:10 },
  { si:5,  status:"ASSIGNED",    priority:"NORMAL", ci:2, di:11 },
  { si:6,  status:"ASSIGNED",    priority:"LOW",    ci:1, di:13 },
  { si:7,  status:"ASSIGNED",    priority:"HIGH",   ci:5, di:14 },
  // IN_PROGRESS (4)
  { si:8,  status:"IN_PROGRESS", priority:"HIGH",   ci:0, di:18 },
  { si:9,  status:"IN_PROGRESS", priority:"NORMAL", ci:1, di:19 },
  { si:10, status:"IN_PROGRESS", priority:"LOW",    ci:3, di:21 },
  { si:11, status:"IN_PROGRESS", priority:"HIGH",   ci:5, di:22 },
  // RESOLVED with feedback (5)
  { si:12, status:"RESOLVED", priority:"HIGH",   ci:0, di:0, rating:5, comment:"Fixed very quickly, great service!" },
  { si:13, status:"RESOLVED", priority:"NORMAL", ci:1, di:1, rating:4, comment:"Good work, resolved in 2 days."     },
  { si:14, status:"RESOLVED", priority:"NORMAL", ci:2, di:2, rating:5, comment:"Excellent, room is clean now."      },
  { si:0,  status:"RESOLVED", priority:"HIGH",   ci:5, di:3, rating:5, comment:"Security issue fixed immediately!"  },
  { si:1,  status:"RESOLVED", priority:"LOW",    ci:4, di:4, rating:3, comment:"WiFi is better but still slow."     },
  // REJECTED (3)
  { si:2,  status:"REJECTED", priority:"LOW",    ci:7, di:5  },
  { si:3,  status:"REJECTED", priority:"NORMAL", ci:6, di:6  },
  { si:4,  status:"REJECTED", priority:"HIGH",   ci:1, di:7  },
];


// ── main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║   HostelFixIT — Full Reseed v3                   ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  // 1. Admin login
  log("STEP 1 — Admin Login");
  adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  if (!adminToken) { console.error("❌ Admin login failed. Backend running?"); process.exit(1); }
  ok("Logged in as", ADMIN_EMAIL);

  // 2. Delete complaints
  log("STEP 2 — Clear Complaints");
  let dc = 0;
  while (true) {
    const r = await req("GET", "/api/admin/complaints?page=0&size=50");
    const list = r?.content || [];
    if (!list.length) break;
    for (const c of list) { await req("DELETE", `/api/admin/complaints/${c.id}`); dc++; await delay(30); }
    if (r.last) break;
  }
  ok("Deleted complaints", dc);

  // 3. Delete non-admin users
  log("STEP 3 — Clear Users");
  let du = 0;
  while (true) {
    const r = await req("GET", "/api/admin/users?page=0&size=50");
    const toDelete = (r?.content || []).filter(u => u.email !== ADMIN_EMAIL && u.email !== SUPER_EMAIL);
    if (!toDelete.length) break;
    for (const u of toDelete) { await req("DELETE", `/api/admin/users/${u.id}`); du++; await delay(40); }
  }
  ok("Deleted users", du);

  // 4. Delete hostels
  log("STEP 4 — Clear Hostels");
  let dh = 0;
  const hr = await req("GET", "/api/admin/hostels?size=50");
  const existH = Array.isArray(hr) ? hr : hr?.content || [];
  for (const h of existH) { await req("DELETE", `/api/admin/hostels/${h.id}`); dh++; await delay(50); }
  ok("Deleted hostels", dh);

  // 5. Create hostels
  log("STEP 5 — Create Hostels");
  const hostelIds = [];
  for (const h of HOSTELS) {
    const c = await req("POST", "/api/admin/hostels", h);
    if (!c?.id) { console.error(`❌ Failed: ${h.name}`); process.exit(1); }
    ok("Created", h.name); hostelIds.push(c.id); await delay(80);
  }

  // 6. Categories
  log("STEP 6 — Fetch Categories");
  const catRes = await req("GET", "/api/admin/categories");
  const cats = Array.isArray(catRes) ? catRes : catRes?.content || [];
  ok("Categories", cats.length);
  if (!cats.length) { console.error("❌ No categories"); process.exit(1); }
  const catIds = cats.map(c => c.id);

  // 7. Create wardens (no login during creation)
  log("STEP 7 — Create Wardens");
  const wardenCreated = [];
  for (let i = 0; i < WARDENS.length; i++) {
    const c = await req("POST", "/api/admin/users", { ...WARDENS[i], role: "WARDEN", hostelId: hostelIds[i] });
    ok(`Warden → ${HOSTELS[i].name}`, WARDENS[i].name);
    wardenCreated.push(!!c);
    await delay(80);
  }

  // 8. Create workers (no login during creation, capture IDs)
  log("STEP 8 — Create Workers");
  const workerIds = []; // { id, hostelIdx, email }
  for (let i = 0; i < WORKERS.length; i++) {
    const hi = Math.floor(i / 2);
    const c = await req("POST", "/api/admin/users", { ...WORKERS[i], role: "WORKER", hostelId: hostelIds[hi] });
    ok(`Worker → ${HOSTELS[hi].name}`, WORKERS[i].name);
    if (c?.id) workerIds.push({ id: c.id, hostelIdx: hi, email: WORKERS[i].email });
    else {
      // Fallback: response may not include id — will fetch below
      workerIds.push({ id: null, hostelIdx: hi, email: WORKERS[i].email });
    }
    await delay(80);
  }
  // Fetch worker IDs by logging in as each worker
  log("STEP 8b — Fetch Worker IDs");
  for (let i = 0; i < workerIds.length; i++) {
    if (!workerIds[i].id) {
      const t = await login(workerIds[i].email, WORKERS[i].password);
      if (t) {
        // Decode JWT to get userId
        const payload = JSON.parse(Buffer.from(t.split('.')[1], 'base64').toString());
        workerIds[i].id = payload.userId || payload.sub;
        workerIds[i].token = t;
        ok("Worker ID fetched", WORKERS[i].name);
      }
    }
  }

  log("STEP 9 — Create Students");
  const studentCreated = []; // { id, hostelIdx, email, password }
  for (let i = 0; i < STUDENTS.length; i++) {
    const hi = Math.floor(i / 5);
    const c = await req("POST", "/api/admin/users", { ...STUDENTS[i], role: "STUDENT", hostelId: hostelIds[hi] });
    ok(`Student → ${HOSTELS[hi].name}`, STUDENTS[i].name);
    studentCreated.push({ id: c?.id, hostelIdx: hi, email: STUDENTS[i].email, password: STUDENTS[i].password });
    await delay(80);
  }

  // 9b. Login all wardens
  log("STEP 9b — Login Wardens");
  const wardenTokens = [];
  for (let i = 0; i < WARDENS.length; i++) {
    const t = await login(WARDENS[i].email, WARDENS[i].password);
    ok(`Token for`, WARDENS[i].name); wardenTokens.push(t); await delay(200);
  }

  // 9c. Login workers we need for complaints
  log("STEP 9c — Login Workers");
  const workerTokens = {}; // email → token
  for (const w of WORKERS) {
    const t = await login(w.email, w.password);
    ok(`Token for`, w.name); workerTokens[w.email] = t; await delay(200);
  }

  // 9d. Login students
  log("STEP 9d — Login Students");
  const studentTokens = {}; // email → token
  for (const s of STUDENTS) {
    const t = await login(s.email, s.password);
    ok(`Token for`, s.name); studentTokens[s.email] = t; await delay(200);
  }

  // 10. Create complaints
  log("STEP 10 — Create Complaints");
  let created = 0, resolved = 0;

  for (const p of PLANS) {
    const sc = studentCreated[p.si];
    if (!sc) { info(`Skip: no student ${p.si}`); continue; }
    const sToken = studentTokens[sc.email];
    if (!sToken) { info(`Skip: no token for ${sc.email}`); continue; }

    const hi = sc.hostelIdx;
    const warden = wardenTokens[hi];
    const hostelWorkers = workerIds.filter(w => w.hostelIdx === hi);

    // File complaint (multipart)
    const form = new FormData();
    form.append("description", DESCS[p.di % DESCS.length]);
    form.append("categoryId",  catIds[p.ci % catIds.length]);
    form.append("priority",    p.priority);
    const complaint = await req("POST", "/api/student/complaints", form, sToken, true);
    if (!complaint?.id) { info(`Filing failed: student ${p.si}`); await delay(60); continue; }
    created++;
    const cid = complaint.id;

    // PENDING → done
    if (p.status === "PENDING") { info(`[PENDING]     ${DESCS[p.di%DESCS.length].slice(0,50)}...`); await delay(60); continue; }

    // REJECTED → warden rejects
    if (p.status === "REJECTED") {
      if (warden) await req("PUT", `/api/warden/complaints/${cid}/reject`, {}, warden);
      info(`[REJECTED]    ${DESCS[p.di%DESCS.length].slice(0,50)}...`);
      await delay(60); continue;
    }

    const workerEntry = hostelWorkers[created % hostelWorkers.length];
    const wkToken = workerEntry?.token || (workerEntry ? await login(WORKERS[workerIds.indexOf(workerEntry)%WORKERS.length]?.email, WORKERS[workerIds.indexOf(workerEntry)%WORKERS.length]?.password) : null);
    if (!workerEntry?.id) { info(`No worker for hostel ${hi}`); await delay(60); continue; }
    if (warden) await req("PUT", `/api/warden/complaints/${cid}/assign/${workerEntry.id}`, {}, warden);

    if (p.status === "ASSIGNED") {
      info(`[ASSIGNED]    ${DESCS[p.di%DESCS.length].slice(0,50)}...`);
      await delay(60); continue;
    }

    // Start work
    if (wkToken) await req("PUT", `/api/worker/complaints/${cid}/start`, {}, wkToken);

    if (p.status === "IN_PROGRESS") {
      info(`[IN_PROGRESS] ${DESCS[p.di%DESCS.length].slice(0,50)}...`);
      await delay(60); continue;
    }

    // Resolve
    if (wkToken) await req("PUT", `/api/worker/complaints/${cid}/resolve`, {}, wkToken);

    // Feedback
    if (p.rating && sToken) {
      await req("POST", "/api/student/feedback",
        { complaintId: cid, rating: p.rating, comment: p.comment || "Good service." },
        sToken
      );
      resolved++;
    }
    info(`[RESOLVED]    ${DESCS[p.di%DESCS.length].slice(0,50)}... ★${p.rating}`);
    await delay(80);
  }

  ok("Complaints created", created);
  ok("Resolved with feedback", resolved);

  log("✅ ALL DONE");
  console.log(`
  ┌─────────────────────────────────────────────────────┐
  │  WHAT'S IN THE DB NOW                               │
  ├─────────────────────────────────────────────────────┤
  │  Hostels   : 3                                      │
  │  Wardens   : 3  (1 per hostel)                      │
  │  Workers   : 6  (2 per hostel)                      │
  │  Students  : 15 (5 per hostel)                      │
  │  Complaints: ${String(created).padEnd(27)}│
  │    PENDING / ASSIGNED / IN_PROGRESS                 │
  │    RESOLVED (with ratings) / REJECTED               │
  ├─────────────────────────────────────────────────────┤
  │  CREDENTIALS                                        │
  │  superadmin@hostelfixit.com   CHANGE_ME             │
  │  admin@hocom.com              Admin@123             │
  │  warden.sunrise@hostelfixit.com  Warden@123         │
  │  worker1.sunrise@hostelfixit.com Worker@123         │
  │  aarav@student.com            Student@123           │
  └─────────────────────────────────────────────────────┘
  `);
}

run().catch(e => { console.error("❌ Crashed:", e.message); process.exit(1); });
