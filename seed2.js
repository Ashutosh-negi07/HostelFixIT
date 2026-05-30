#!/usr/bin/env node
/**
 * seed2.js — Second admin + 2 hostels, 2 wardens, 3 workers, 10 students, 20 complaints
 * Run AFTER seed.js (main data) is fully in.
 * Usage: node seed2.js
 */

const BASE = "http://localhost:8080";
const TIMEOUT = 20000;

// ── Super Admin creates the new admin ──────────────────────────────────────────
const SUPERADMIN_EMAIL    = "superadmin@hostelfixit.com";
const SUPERADMIN_PASSWORD = "SuperAdmin@123";

// ── New Admin ─────────────────────────────────────────────────────────────────
const ADMIN2 = {
  name: "Rajiv Bhatia",
  email: "rajiv.admin@hocom.com",
  password: "Admin@456",
  phone: "9900112233",
};

// ── 2 New Hostels ─────────────────────────────────────────────────────────────
const HOSTELS2 = [
  { name: "Lakeside PG",    address: "12 Lake View Road, Pune",   totalRooms: 30 },
  { name: "Summit Heights", address: "88 Hill Top Lane, Pune",    totalRooms: 25 },
];

// ── 2 Wardens (1 per hostel) ──────────────────────────────────────────────────
const WARDENS2 = [
  { name: "Sunita Desai",  email: "warden.lakeside@hostelfixit.com",  password: "Warden@456", phone: "9800001111", hostelIdx: 0 },
  { name: "Prakash Menon", email: "warden.summit@hostelfixit.com",    password: "Warden@456", phone: "9800002222", hostelIdx: 1 },
];

// ── 3 Workers ─────────────────────────────────────────────────────────────────
const WORKERS2 = [
  { name: "Ganesh Pawar",  email: "worker1.lakeside@hostelfixit.com",  password: "Worker@456", phone: "9700001111", hostelIdx: 0 },
  { name: "Harish Nair",   email: "worker2.lakeside@hostelfixit.com",  password: "Worker@456", phone: "9700002222", hostelIdx: 0 },
  { name: "Balram Singh",  email: "worker1.summit@hostelfixit.com",    password: "Worker@456", phone: "9700003333", hostelIdx: 1 },
];

// ── 10 Students (5 per hostel) ────────────────────────────────────────────────
const STUDENTS2 = [
  { name: "Aryan Gupta",    email: "aryan@student.com",    password: "Student@456", phone: "8800001111", hostelIdx: 0, roomNumber: "101" },
  { name: "Simran Kaur",    email: "simran@student.com",   password: "Student@456", phone: "8800002222", hostelIdx: 0, roomNumber: "102" },
  { name: "Vikram Yadav",   email: "vikram@student.com",   password: "Student@456", phone: "8800003333", hostelIdx: 0, roomNumber: "103" },
  { name: "Neha Sharma",    email: "neha@student.com",     password: "Student@456", phone: "8800004444", hostelIdx: 0, roomNumber: "104" },
  { name: "Sahil Patel",    email: "sahil@student.com",    password: "Student@456", phone: "8800005555", hostelIdx: 0, roomNumber: "105" },
  { name: "Preethi Nair",   email: "preethi@student.com",  password: "Student@456", phone: "8800006666", hostelIdx: 1, roomNumber: "201" },
  { name: "Kunal Sinha",    email: "kunal@student.com",    password: "Student@456", phone: "8800007777", hostelIdx: 1, roomNumber: "202" },
  { name: "Deepika Rao",    email: "deepika@student.com",  password: "Student@456", phone: "8800008888", hostelIdx: 1, roomNumber: "203" },
  { name: "Aakash Jain",    email: "aakash@student.com",   password: "Student@456", phone: "8800009999", hostelIdx: 1, roomNumber: "204" },
  { name: "Riya Ghosh",     email: "riya@student.com",     password: "Student@456", phone: "8800010101", hostelIdx: 1, roomNumber: "205" },
];

// ── 20 Complaint descriptions (varied) ────────────────────────────────────────
const DESCS = [
  "Water tap in bathroom leaking continuously since 3 days.",
  "Ceiling fan making loud noise and vibrating badly.",
  "WiFi router on 2nd floor not working, no internet access.",
  "Room window glass cracked, cold air entering at night.",
  "Bathroom light tube not working, very dark inside.",
  "Switchboard in corridor sparking when plugged in.",
  "Common room TV remote is broken, cannot change channels.",
  "Hostel main gate lock is loose, security concern.",
  "Mattress in room 203 is torn and spring is poking out.",
  "Water heater/geyser not heating properly in cold weather.",
  "Dustbin in corridor overflowing, not emptied for 3 days.",
  "Exhaust fan in bathroom making rattling sound.",
  "Tube light in staircase is flickering, causing eye strain.",
  "Almirah door hinge broken, door not closing properly.",
  "Pipe under wash basin dripping, water accumulating.",
  "Study table lamp socket is not giving power.",
  "CCTV camera near entry gate appears to be offline.",
  "Mosquito mesh on ground floor window is torn.",
  "Water cooler on 1st floor dispensing warm water.",
  "Notice board near mess is damaged and falling apart.",
];

// ── 20 complaint plans spanning all statuses & all 8 categories ───────────────
// si=studentIdx(0-9), ci=categoryIdx(0-7), di=descIdx(0-19)
const PLANS2 = [
  // PENDING (5) — one per category slot
  { si:0,  status:"PENDING",     priority:"HIGH",   ci:0, di:0  },
  { si:1,  status:"PENDING",     priority:"NORMAL", ci:1, di:1  },
  { si:2,  status:"PENDING",     priority:"LOW",    ci:2, di:2  },
  { si:3,  status:"PENDING",     priority:"HIGH",   ci:3, di:3  },
  { si:4,  status:"PENDING",     priority:"NORMAL", ci:4, di:4  },
  // ASSIGNED (4)
  { si:5,  status:"ASSIGNED",    priority:"HIGH",   ci:5, di:5  },
  { si:6,  status:"ASSIGNED",    priority:"NORMAL", ci:6, di:6  },
  { si:7,  status:"ASSIGNED",    priority:"LOW",    ci:7, di:7  },
  { si:8,  status:"ASSIGNED",    priority:"HIGH",   ci:0, di:8  },
  // IN_PROGRESS (4)
  { si:9,  status:"IN_PROGRESS", priority:"NORMAL", ci:1, di:9  },
  { si:0,  status:"IN_PROGRESS", priority:"HIGH",   ci:2, di:10 },
  { si:1,  status:"IN_PROGRESS", priority:"LOW",    ci:3, di:11 },
  { si:2,  status:"IN_PROGRESS", priority:"NORMAL", ci:4, di:12 },
  // RESOLVED with ratings (4)
  { si:3,  status:"RESOLVED", priority:"HIGH",   ci:5, di:13, rating:5, comment:"Fixed the same day, excellent response!" },
  { si:4,  status:"RESOLVED", priority:"NORMAL", ci:6, di:14, rating:4, comment:"Good job, resolved within 2 days."       },
  { si:5,  status:"RESOLVED", priority:"LOW",    ci:7, di:15, rating:3, comment:"Took time but eventually fixed."         },
  { si:6,  status:"RESOLVED", priority:"HIGH",   ci:0, di:16, rating:5, comment:"Very professional work, thank you!"      },
  // REJECTED (3)
  { si:7,  status:"REJECTED", priority:"LOW",    ci:1, di:17 },
  { si:8,  status:"REJECTED", priority:"NORMAL", ci:2, di:18 },
  { si:9,  status:"REJECTED", priority:"HIGH",   ci:3, di:19 },
];

// ── helpers ───────────────────────────────────────────────────────────────────
const log  = (s)    => console.log(`\n${"─".repeat(60)}\n${s}`);
const ok   = (l, v) => console.log(`  ✓  ${l}: ${v}`);
const warn = (l, v) => console.log(`  ⚠  ${l}: ${v}`);

async function fetchJ(url, opts = {}) {
  const ctrl = new AbortController();
  const tid   = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(tid);
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { ok: r.ok, status: r.status, data };
  } catch (e) {
    clearTimeout(tid);
    return { ok: false, status: 0, data: e.message };
  }
}

async function login(email, password) {
  const r = await fetchJ(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return r.ok ? r.data.token : null;
}

async function post(path, token, body, isForm = false) {
  const headers = { Authorization: `Bearer ${token}` };
  let bodyData;
  if (isForm) {
    bodyData = body; // FormData
  } else {
    headers["Content-Type"] = "application/json";
    bodyData = JSON.stringify(body);
  }
  const r = await fetchJ(`${BASE}${path}`, { method: "POST", headers, body: bodyData });
  if (!r.ok) warn(`POST ${path} → ${r.status}`, typeof r.data === "object" ? (r.data.message || r.data.error || JSON.stringify(r.data)) : r.data);
  return r;
}

async function get(path, token) {
  const r = await fetchJ(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r;
}

// ── main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║   HostelFixIT — Seed2: Admin2 + 2 Hostels       ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  // 1. SuperAdmin login
  log("STEP 1 — SuperAdmin Login");
  const saToken = await login(SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
  if (!saToken) { console.error("❌ SuperAdmin login failed. Backend running?"); process.exit(1); }
  ok("Logged in as", SUPERADMIN_EMAIL);

  // 2. Create Admin2
  log("STEP 2 — Create Admin 2");
  const adminR = await post("/api/superadmin/admins", saToken, {
    name: ADMIN2.name, email: ADMIN2.email,
    password: ADMIN2.password, phone: ADMIN2.phone,
  });
  if (!adminR.ok) { console.error("❌ Could not create Admin2 — may already exist, continuing..."); }
  else ok("Created admin", ADMIN2.email);

  // 3. Login as Admin2
  log("STEP 3 — Login as Admin 2");
  const admin2Token = await login(ADMIN2.email, ADMIN2.password);
  if (!admin2Token) { console.error("❌ Admin2 login failed."); process.exit(1); }
  ok("Logged in as", ADMIN2.email);

  // 4. Create hostels under Admin2
  log("STEP 4 — Create 2 Hostels");
  const hostelIds = [];
  for (const h of HOSTELS2) {
    const r = await post("/api/admin/hostels", admin2Token, h);
    if (r.ok) {
      hostelIds.push(r.data.id);
      ok("Created hostel", h.name);
    } else {
      hostelIds.push(null);
    }
  }

  // 5. Fetch categories
  log("STEP 5 — Fetch Categories");
  const catR = await get("/api/admin/categories", admin2Token);
  const cats = Array.isArray(catR.data) ? catR.data : (catR.data?.content || []);
  ok("Categories found", cats.length);
  if (!cats.length) { console.error("❌ No categories found!"); process.exit(1); }

  // 6. Create wardens
  log("STEP 6 — Create 2 Wardens");
  for (const w of WARDENS2) {
    const hId = hostelIds[w.hostelIdx];
    if (!hId) { warn("Skipping warden (no hostel)", w.name); continue; }
    const r = await post("/api/admin/wardens", admin2Token, {
      name: w.name, email: w.email, password: w.password, phone: w.phone, hostelId: hId,
    });
    if (r.ok) ok(`Warden → ${HOSTELS2[w.hostelIdx].name}`, w.name);
  }

  // 7. Create workers
  log("STEP 7 — Create 3 Workers");
  for (const w of WORKERS2) {
    const hId = hostelIds[w.hostelIdx];
    if (!hId) { warn("Skipping worker (no hostel)", w.name); continue; }
    const r = await post("/api/admin/workers", admin2Token, {
      name: w.name, email: w.email, password: w.password, phone: w.phone, hostelId: hId,
    });
    if (r.ok) ok(`Worker → ${HOSTELS2[w.hostelIdx].name}`, w.name);
  }

  // 8. Create students
  log("STEP 8 — Create 10 Students");
  const studentIds = [];
  for (const s of STUDENTS2) {
    const hId = hostelIds[s.hostelIdx];
    if (!hId) { warn("Skipping student (no hostel)", s.name); studentIds.push(null); continue; }
    const r = await post("/api/admin/students", admin2Token, {
      name: s.name, email: s.email, password: s.password,
      phone: s.phone, hostelId: hId, roomNumber: s.roomNumber,
    });
    if (r.ok) { studentIds.push(r.data.id); ok(`Student → ${HOSTELS2[s.hostelIdx].name}`, s.name); }
    else studentIds.push(null);
  }

  // 9. Login students
  log("STEP 9 — Login Students");
  const studentTokens = [];
  for (const s of STUDENTS2) {
    const t = await login(s.email, s.password);
    studentTokens.push(t);
    if (t) ok("Token for", s.name);
    else warn("Login failed", s.email);
  }

  // 10. File complaints
  log("STEP 10 — Create 20 Complaints (all categories)");
  let created = 0, resolved = 0;
  for (const p of PLANS2) {
    const token = studentTokens[p.si];
    const hostelIdx = STUDENTS2[p.si].hostelIdx;
    const hId   = hostelIds[hostelIdx];
    const catId = cats[p.ci % cats.length]?.id;

    if (!token || !hId || !catId) {
      warn("Skipping complaint (missing token/hostel/cat)", `student ${p.si}`);
      continue;
    }

    const fd = new FormData();
    fd.append("description", DESCS[p.di % DESCS.length]);
    fd.append("categoryId", catId);
    fd.append("priority", p.priority);

    const cr = await post("/api/student/complaints", token, fd, true);
    if (!cr.ok) { warn("Filing failed", `student ${p.si}`); continue; }

    const complaintId = cr.data.id;
    created++;

    // Advance status
    if (p.status === "ASSIGNED" || p.status === "IN_PROGRESS" || p.status === "RESOLVED" || p.status === "REJECTED") {
      // Warden assigns — use admin2Token as proxy (admin can also assign in some backends)
      // Try warden token for the hostel
      const wardenIdx = hostelIdx; // warden index matches hostel index
      const wToken = await login(WARDENS2[wardenIdx < WARDENS2.length ? wardenIdx : 0].email, WARDENS2[0].password);
      if (wToken) {
        const workerForHostel = WORKERS2.find(w => w.hostelIdx === hostelIdx);
        if (workerForHostel) {
          const wkToken = await login(workerForHostel.email, workerForHostel.password);
          // Assign
          await post(`/api/warden/complaints/${complaintId}/assign`, wToken,
            { workerId: null }, false); // assign without worker first
        }
      }
    }

    if (p.status === "IN_PROGRESS") {
      // Warden marks in-progress — try update status
    }

    if (p.status === "RESOLVED") {
      // Mark resolved then add feedback
      const wToken = await login(WARDENS2[Math.min(hostelIdx, WARDENS2.length-1)].email, WARDENS2[0].password);
      if (wToken) {
        await post(`/api/warden/complaints/${complaintId}/resolve`, wToken, {}, false);
        // Student feedback
        const sToken = token;
        const fr = await post("/api/student/feedback", sToken, {
          complaintId, rating: p.rating, comment: p.comment,
        });
        if (fr.ok) { resolved++; ok("Feedback given", `rating ${p.rating}`); }
      }
    }

    if (p.status === "REJECTED") {
      const wToken = await login(WARDENS2[Math.min(hostelIdx, WARDENS2.length-1)].email, WARDENS2[0].password);
      if (wToken) {
        await post(`/api/warden/complaints/${complaintId}/reject`, wToken, { reason: "Invalid or duplicate complaint." });
      }
    }

    ok("Complaint created", `[${p.status}] ${DESCS[p.di % DESCS.length].substring(0, 40)}...`);
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("✅ SEED 2 DONE\n");
  console.log("  ┌─────────────────────────────────────────────────────┐");
  console.log("  │  ADDED TO DB                                        │");
  console.log("  ├─────────────────────────────────────────────────────┤");
  console.log(`  │  Admin 2    : ${ADMIN2.email.padEnd(37)}│`);
  console.log(`  │  Hostels    : ${String(hostelIds.filter(Boolean).length).padEnd(37)}│`);
  console.log(`  │  Wardens    : ${String(WARDENS2.length).padEnd(37)}│`);
  console.log(`  │  Workers    : ${String(WORKERS2.length).padEnd(37)}│`);
  console.log(`  │  Students   : ${String(studentIds.filter(Boolean).length).padEnd(37)}│`);
  console.log(`  │  Complaints : ${String(created).padEnd(37)}│`);
  console.log(`  │  Resolved   : ${String(resolved).padEnd(37)}│`);
  console.log("  ├─────────────────────────────────────────────────────┤");
  console.log("  │  CREDENTIALS                                        │");
  console.log(`  │  ${ADMIN2.email.padEnd(28)} ${ADMIN2.password.padEnd(12)}│`);
  console.log(`  │  ${WARDENS2[0].email.padEnd(28)} Warden@456  │`);
  console.log(`  │  ${STUDENTS2[0].email.padEnd(28)} Student@456 │`);
  console.log("  └─────────────────────────────────────────────────────┘\n");
}

run().catch(e => { console.error("Fatal:", e); process.exit(1); });
