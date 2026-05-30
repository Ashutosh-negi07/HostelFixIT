#!/usr/bin/env node
/**
 * seed_full.js — Complete fresh seed
 *
 * Structure:
 *   SuperAdmin  (already in DB from DataInitializer)
 *   Admin1      (recreated by DataInitializer on restart)
 *   Admin2      (created here via SuperAdmin)
 *
 *   Admin1 → 2 hostels (Sunrise Residency, Bluebell Boys PG)
 *   Admin2 → 3 hostels (Green Valley, Lakeside PG, Summit Heights)
 *
 *   Per hostel: 1 warden · 2 workers · 4 students
 *   Complaints: 5 per hostel (25 total) — all statuses covered
 */

const BASE    = "http://localhost:8080";
const DELAY   = 250;   // ms between API calls
const TIMEOUT = 20_000;

// ── Credentials ───────────────────────────────────────────────────────────────
const SA = { email: "superadmin@hostelfixit.com", password: "SuperAdmin@123" };
const A1 = { email: "admin@hocom.com",            password: "Admin@123"      };
const A2 = { email: "admin2@hocom.com",            password: "Admin2@123"     };

// ── Admin2 creation payload ───────────────────────────────────────────────────
const ADMIN2 = { name: "Rajiv Bhatia", email: A2.email, password: A2.password, phone: 9900112233, role: "ADMIN" };

// ── Hostels ───────────────────────────────────────────────────────────────────
const H_A1 = [
  { name: "Sunrise Residency",   address: "12 MG Road, Pune",          totalRooms: 40 },
  { name: "Bluebell Boys PG",    address: "45 Park Street, Pune",       totalRooms: 35 },
];
const H_A2 = [
  { name: "Green Valley Hostel", address: "78 NH-48 Bypass, Pune",      totalRooms: 50 },
  { name: "Lakeside PG",         address: "12 Lake View Road, Pune",    totalRooms: 30 },
  { name: "Summit Heights",      address: "88 Hill Top Lane, Pune",     totalRooms: 25 },
];

// ── Per-hostel data (index matches combined hostel array: 0-1 → A1, 2-4 → A2) ─
// Hostel index: 0=Sunrise, 1=Bluebell, 2=Green, 3=Lakeside, 4=Summit

const WARDENS = [
  { name:"Ankit Sharma",  email:"warden.sunrise@hocom.com",  password:"Warden@123", phone:"9800000001", hi:0 },
  { name:"Pooja Mehta",   email:"warden.bluebell@hocom.com", password:"Warden@123", phone:"9800000002", hi:1 },
  { name:"Ramesh Iyer",   email:"warden.green@hocom.com",    password:"Warden@123", phone:"9800000003", hi:2 },
  { name:"Sunita Desai",  email:"warden.lakeside@hocom.com", password:"Warden@123", phone:"9800000004", hi:3 },
  { name:"Prakash Menon", email:"warden.summit@hocom.com",   password:"Warden@123", phone:"9800000005", hi:4 },
];

const WORKERS = [
  { name:"Manoj Tiwari",  email:"manoj.w@hocom.com",  password:"Worker@123", phone:"9711000001", hi:0 },
  { name:"Suresh Pal",    email:"suresh.w@hocom.com", password:"Worker@123", phone:"9711000002", hi:0 },
  { name:"Vijay Nair",    email:"vijay.w@hocom.com",  password:"Worker@123", phone:"9711000003", hi:1 },
  { name:"Ravi Dubey",    email:"ravi.w@hocom.com",   password:"Worker@123", phone:"9711000004", hi:1 },
  { name:"Deepak Gupta",  email:"deepak.w@hocom.com", password:"Worker@123", phone:"9711000005", hi:2 },
  { name:"Amit Yadav",    email:"amit.w@hocom.com",   password:"Worker@123", phone:"9711000006", hi:2 },
  { name:"Ganesh Pawar",  email:"ganesh.w@hocom.com", password:"Worker@123", phone:"9711000007", hi:3 },
  { name:"Harish Nair",   email:"harish.w@hocom.com", password:"Worker@123", phone:"9711000008", hi:3 },
  { name:"Balram Singh",  email:"balram.w@hocom.com", password:"Worker@123", phone:"9711000009", hi:4 },
  { name:"Prem Kumar",    email:"prem.w@hocom.com",   password:"Worker@123", phone:"9711000010", hi:4 },
];

const STUDENTS = [
  // Sunrise (hi:0)
  { name:"Aarav Mehta",    email:"aarav@student.com",    password:"Student@123", phone:"8800000001", room:"101", hi:0 },
  { name:"Priya Singh",    email:"priya@student.com",    password:"Student@123", phone:"8800000002", room:"102", hi:0 },
  { name:"Dev Kapoor",     email:"dev@student.com",      password:"Student@123", phone:"8800000003", room:"103", hi:0 },
  { name:"Sneha Roy",      email:"sneha@student.com",    password:"Student@123", phone:"8800000004", room:"104", hi:0 },
  // Bluebell (hi:1)
  { name:"Rahul Joshi",    email:"rahul@student.com",    password:"Student@123", phone:"8800000005", room:"201", hi:1 },
  { name:"Kavya Reddy",    email:"kavya@student.com",    password:"Student@123", phone:"8800000006", room:"202", hi:1 },
  { name:"Nikhil Rao",     email:"nikhil@student.com",   password:"Student@123", phone:"8800000007", room:"203", hi:1 },
  { name:"Ananya Bose",    email:"ananya@student.com",   password:"Student@123", phone:"8800000008", room:"204", hi:1 },
  // Green Valley (hi:2)
  { name:"Tanvi Patil",    email:"tanvi@student.com",    password:"Student@123", phone:"8800000009", room:"301", hi:2 },
  { name:"Rohan Kulkarni", email:"rohan@student.com",    password:"Student@123", phone:"8800000010", room:"302", hi:2 },
  { name:"Meera Nambiar",  email:"meera@student.com",    password:"Student@123", phone:"8800000011", room:"303", hi:2 },
  { name:"Karan Shah",     email:"karan@student.com",    password:"Student@123", phone:"8800000012", room:"304", hi:2 },
  // Lakeside (hi:3)
  { name:"Aryan Gupta",    email:"aryan@student.com",    password:"Student@123", phone:"8800000013", room:"401", hi:3 },
  { name:"Simran Kaur",    email:"simran@student.com",   password:"Student@123", phone:"8800000014", room:"402", hi:3 },
  { name:"Vikram Yadav",   email:"vikram@student.com",   password:"Student@123", phone:"8800000015", room:"403", hi:3 },
  { name:"Neha Sharma",    email:"neha@student.com",     password:"Student@123", phone:"8800000016", room:"404", hi:3 },
  // Summit Heights (hi:4)
  { name:"Preethi Nair",   email:"preethi@student.com",  password:"Student@123", phone:"8800000017", room:"501", hi:4 },
  { name:"Kunal Sinha",    email:"kunal@student.com",    password:"Student@123", phone:"8800000018", room:"502", hi:4 },
  { name:"Deepika Rao",    email:"deepika@student.com",  password:"Student@123", phone:"8800000019", room:"503", hi:4 },
  { name:"Aakash Jain",    email:"aakash@student.com",   password:"Student@123", phone:"8800000020", room:"504", hi:4 },
];

// ── Complaint descriptions (varied categories) ────────────────────────────────
const DESC = [
  "Bathroom tap leaking continuously since 3 days, water being wasted.",
  "Room ceiling fan making loud noise and vibrating badly at full speed.",
  "WiFi router on 2nd floor not working since yesterday, no internet.",
  "Main gate lock is broken, anyone can enter at night — urgent fix needed.",
  "Geyser not heating water properly, no hot water since 2 days.",
  "Switchboard in room corridor sparking when device plugged in.",
  "Common room TV remote broken, cannot change channels.",
  "Dustbin in corridor overflowing, not emptied in 3 days.",
  "Window glass cracked in room, cold air entering at night.",
  "Exhaust fan in bathroom making rattling sound continuously.",
  "Tube light in staircase flickering, causing eye strain.",
  "Almirah door hinge broken, door not closing properly.",
  "Pipe under wash basin dripping, water accumulating on floor.",
  "CCTV camera near entrance appears to be offline.",
  "Study room desk lamp socket not giving power.",
  "Mosquito mesh on ground floor window is torn, insects entering.",
  "Water cooler on 1st floor dispensing warm/hot water only.",
  "Notice board near mess hall is damaged and falling apart.",
  "Elevator buttons on 2nd floor panel are unresponsive.",
  "Fire extinguisher in block B corridor is past expiry date.",
  "Mattress in room is torn and spring poking out, causing injury risk.",
  "Bathroom floor drain clogged, water not draining after shower.",
  "Common kitchen microwave door seal broken, leaking steam.",
  "Parking area lights not working, very dark and unsafe at night.",
  "Water pressure very low in morning hours, unable to shower properly.",
];

// ── Complaint plans per hostel (5 complaints × 5 hostels = 25 total) ──────────
// si = student index within that hostel (0-3)
// status: PENDING | ASSIGNED | IN_PROGRESS | RESOLVED | REJECTED
const PLANS_PER_HOSTEL = [
  { si:0, status:"PENDING",     priority:"HIGH",   ci:0, di:0,  rating:null },
  { si:1, status:"ASSIGNED",    priority:"NORMAL", ci:1, di:1,  rating:null },
  { si:2, status:"IN_PROGRESS", priority:"HIGH",   ci:2, di:2,  rating:null },
  { si:3, status:"RESOLVED",    priority:"NORMAL", ci:3, di:3,  rating:5, comment:"Fixed quickly, great service!" },
  { si:0, status:"REJECTED",    priority:"LOW",    ci:4, di:4,  rating:null },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log   = s  => console.log(`\n${"─".repeat(60)}\n${s}`);
const ok    = (l, v) => console.log(`  ✓  ${l}: ${v}`);
const warn  = (l, v) => console.log(`  ⚠  ${l}: ${v}`);
const err   = (l, v) => console.log(`  ✗  ${l}: ${v}`);

async function fetchJ(url, opts = {}) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r    = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(tid);
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { ok: r.ok, status: r.status, data };
  } catch (e) {
    clearTimeout(tid);
    return { ok: false, status: 0, data: String(e.message || e) };
  }
}

async function login(email, password) {
  const r = await fetchJ(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (r.ok) return r.data.token;
  warn(`Login failed for ${email}`, r.data?.message || r.status);
  return null;
}

async function POST(path, token, body, isForm = false) {
  const headers = { Authorization: `Bearer ${token}` };
  let bd;
  if (isForm) { bd = body; }
  else { headers["Content-Type"] = "application/json"; bd = JSON.stringify(body); }
  return fetchJ(`${BASE}${path}`, { method: "POST", headers, body: bd });
}

async function PUT(path, token, body = {}) {
  return fetchJ(`${BASE}${path}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function GET(path, token) {
  return fetchJ(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║   HostelFixIT — Full Seed with Complaints           ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  // ── 1. SuperAdmin Login ───────────────────────────────────────────────────
  log("STEP 1 — SuperAdmin Login");
  const saToken = await login(SA.email, SA.password);
  if (!saToken) { console.error("❌ SuperAdmin login failed. Is backend running?"); process.exit(1); }
  ok("Logged in", SA.email);

  // ── 2. Admin1 Login ───────────────────────────────────────────────────────
  log("STEP 2 — Admin1 Login");
  const a1Token = await login(A1.email, A1.password);
  if (!a1Token) { console.error("❌ Admin1 login failed (created by DataInitializer on startup)"); process.exit(1); }
  ok("Logged in", A1.email);

  // ── 3. Create Admin2 ──────────────────────────────────────────────────────
  log("STEP 3 — Create Admin2");
  const a2r = await POST("/api/superadmin/admins", saToken, ADMIN2);
  if (a2r.ok) ok("Created", A2.email);
  else warn("Already exists or failed", a2r.data?.message || a2r.status);

  const a2Token = await login(A2.email, A2.password);
  if (!a2Token) { console.error("❌ Admin2 login failed"); process.exit(1); }
  ok("Logged in", A2.email);

  // ── 4. Fetch categories ───────────────────────────────────────────────────
  log("STEP 4 — Fetch Categories");
  const catR = await GET("/api/admin/categories", a1Token);
  const cats  = Array.isArray(catR.data) ? catR.data : (catR.data?.content || []);
  ok("Categories available", cats.length);
  if (!cats.length) { console.error("❌ No categories — did DataInitializer run? Restart backend."); process.exit(1); }

  // ── 5. Create Hostels ─────────────────────────────────────────────────────
  log("STEP 5 — Admin1: Create 2 Hostels");
  const hostelIds = []; // index 0-4
  for (const h of H_A1) {
    const r = await POST("/api/admin/hostels", a1Token, h);
    if (r.ok) { hostelIds.push(r.data.id); ok("Created hostel", h.name); }
    else { err("Hostel failed", h.name); hostelIds.push(null); }
    await sleep(DELAY);
  }

  log("STEP 5b — Admin2: Create 3 Hostels");
  for (const h of H_A2) {
    const r = await POST("/api/admin/hostels", a2Token, h);
    if (r.ok) { hostelIds.push(r.data.id); ok("Created hostel", h.name); }
    else { err("Hostel failed", h.name); hostelIds.push(null); }
    await sleep(DELAY);
  }
  // hostelIds = [sunrise, bluebell, green, lakeside, summit]

  // token per hostel index
  const hostelToken = (hi) => hi < 2 ? a1Token : a2Token;

  // ── 6. Create Wardens ─────────────────────────────────────────────────────
  log("STEP 6 — Create 5 Wardens (1 per hostel)");
  const wardenTokens = {}; // hi → token
  for (const w of WARDENS) {
    const hId = hostelIds[w.hi];
    if (!hId) { warn("Skip warden (no hostel)", w.name); continue; }
    const r = await POST("/api/admin/users", hostelToken(w.hi), {
      name: w.name, email: w.email, password: w.password, phone: Number(w.phone),
      role: "WARDEN", hostelId: hId,
    });
    if (r.ok) {
      ok(`Warden`, w.name);
      const t = await login(w.email, w.password);
      if (t) wardenTokens[w.hi] = t;
    } else err("Warden failed", `${w.name}: ${r.data?.message || r.status}`);
    await sleep(DELAY);
  }

  // ── 7. Create Workers ─────────────────────────────────────────────────────
  log("STEP 7 — Create 10 Workers (2 per hostel)");
  const workersByHostel = {}; // hi → [{id, token}]
  for (const w of WORKERS) {
    const hId = hostelIds[w.hi];
    if (!hId) { warn("Skip worker (no hostel)", w.name); continue; }
    const r = await POST("/api/admin/users", hostelToken(w.hi), {
      name: w.name, email: w.email, password: w.password, phone: Number(w.phone),
      role: "WORKER", hostelId: hId,
    });
    if (r.ok) {
      ok(`Worker`, w.name);
      // Get worker ID from JWT
      const t = await login(w.email, w.password);
      if (t) {
        const payload = JSON.parse(Buffer.from(t.split(".")[1], "base64").toString());
        const wid = payload.userId || payload.sub || r.data?.id;
        if (!workersByHostel[w.hi]) workersByHostel[w.hi] = [];
        workersByHostel[w.hi].push({ id: wid, token: t });
      }
    } else err("Worker failed", `${w.name}: ${r.data?.message || r.status}`);
    await sleep(DELAY);
  }

  // ── 8. Create Students ────────────────────────────────────────────────────
  log("STEP 8 — Create 20 Students (4 per hostel)");
  const studentsByHostel = {}; // hi → [{token}]
  for (const s of STUDENTS) {
    const hId = hostelIds[s.hi];
    if (!hId) { warn("Skip student (no hostel)", s.name); continue; }
    const r = await POST("/api/admin/users", hostelToken(s.hi), {
      name: s.name, email: s.email, password: s.password, phone: Number(s.phone),
      role: "STUDENT", hostelId: hId, roomNumber: s.room,
    });
    if (r.ok) {
      ok(`Student`, s.name);
      const t = await login(s.email, s.password);
      if (t) {
        if (!studentsByHostel[s.hi]) studentsByHostel[s.hi] = [];
        studentsByHostel[s.hi].push(t);
      }
    } else err("Student failed", `${s.name}: ${r.data?.message || r.status}`);
    await sleep(DELAY);
  }

  // ── 9. Create Complaints (5 per hostel) ───────────────────────────────────
  log("STEP 9 — Create Complaints (5 per hostel × 5 hostels = 25)");
  let created = 0, resolved = 0;

  for (let hi = 0; hi < 5; hi++) {
    const hId        = hostelIds[hi];
    const wToken     = wardenTokens[hi];
    const workers    = workersByHostel[hi] || [];
    const students   = studentsByHostel[hi] || [];

    if (!hId) { warn(`Skipping hostel ${hi} complaints`, "no hostel ID"); continue; }
    if (!students.length) { warn(`Skipping hostel ${hi} complaints`, "no students"); continue; }

    for (let pi = 0; pi < PLANS_PER_HOSTEL.length; pi++) {
      const p      = PLANS_PER_HOSTEL[pi];
      const sToken = students[p.si % students.length];
      const catId  = cats[p.ci % cats.length]?.id;
      const desc   = DESC[(hi * 5 + pi) % DESC.length];

      if (!sToken || !catId) { warn("Missing token/cat", `hostel ${hi} plan ${pi}`); continue; }

      // File complaint as student
      const fd = new FormData();
      fd.append("description", desc);
      fd.append("categoryId",  catId);
      fd.append("priority",    p.priority);
      const cr = await POST("/api/student/complaints", sToken, fd, true);
      if (!cr.ok) { err("Complaint failed", `${p.status}: ${cr.data?.message || cr.status}`); continue; }

      const cid = cr.data.id;
      created++;

      // PENDING → done
      if (p.status === "PENDING") {
        ok(`[PENDING]    `, desc.slice(0, 45) + "...");
        await sleep(DELAY); continue;
      }

      // REJECTED → warden rejects
      if (p.status === "REJECTED") {
        if (wToken) await PUT(`/api/warden/complaints/${cid}/reject`, wToken, {});
        ok(`[REJECTED]   `, desc.slice(0, 45) + "...");
        await sleep(DELAY); continue;
      }

      // Assign worker
      const worker = workers[pi % workers.length];
      if (!worker?.id || !wToken) {
        ok(`[PENDING→]   `, "No worker/warden — left as PENDING");
        await sleep(DELAY); continue;
      }
      await PUT(`/api/warden/complaints/${cid}/assign`, wToken, { workerId: worker.id });

      if (p.status === "ASSIGNED") {
        ok(`[ASSIGNED]   `, desc.slice(0, 45) + "...");
        await sleep(DELAY); continue;
      }

      // Worker starts
      await PUT(`/api/worker/complaints/${cid}/in-progress`, worker.token, {});

      if (p.status === "IN_PROGRESS") {
        ok(`[IN_PROGRESS]`, desc.slice(0, 45) + "...");
        await sleep(DELAY); continue;
      }

      // Worker resolves
      await PUT(`/api/worker/complaints/${cid}/resolve`, worker.token, {});

      // Student leaves feedback
      if (p.rating) {
        const fb = await POST("/api/student/feedback", sToken, {
          complaintId: cid, rating: p.rating, comment: p.comment || "Good service.",
        });
        if (fb.ok) { resolved++; ok(`[RESOLVED ★${p.rating}]`, desc.slice(0, 40) + "..."); }
        else ok(`[RESOLVED]   `, desc.slice(0, 45) + "...");
      }
      await sleep(DELAY);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("✅  FULL SEED COMPLETE\n");
  console.log("  ┌────────────────────────────────────────────────────────┐");
  console.log("  │  WHAT'S IN THE DB                                      │");
  console.log("  ├────────────────────────────────────────────────────────┤");
  console.log("  │  SuperAdmin  superadmin@hostelfixit.com SuperAdmin@123 │");
  console.log("  │  Admin1      admin@hocom.com            Admin@123      │");
  console.log("  │  Admin2      admin2@hocom.com           Admin2@123     │");
  console.log("  ├──────────────┬─────────────────────────────────────────┤");
  console.log("  │  Admin1      │ Sunrise Residency  (1W · 2Wk · 4S · 5C)│");
  console.log("  │              │ Bluebell Boys PG   (1W · 2Wk · 4S · 5C)│");
  console.log("  │  Admin2      │ Green Valley       (1W · 2Wk · 4S · 5C)│");
  console.log("  │              │ Lakeside PG        (1W · 2Wk · 4S · 5C)│");
  console.log("  │              │ Summit Heights     (1W · 2Wk · 4S · 5C)│");
  console.log("  ├──────────────┴─────────────────────────────────────────┤");
  console.log("  │  Complaints: " + String(created).padEnd(4) + "  (PENDING/ASSIGNED/IN_PROG/RESOLVED/REJECTED)│");
  console.log("  │  Resolved with feedback: " + String(resolved).padEnd(29) + "│");
  console.log("  │  Passwords: Warden@123 · Worker@123 · Student@123     │");
  console.log("  └────────────────────────────────────────────────────────┘\n");
}

run().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
