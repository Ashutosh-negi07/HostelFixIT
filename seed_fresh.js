#!/usr/bin/env node
/**
 * seed_fresh.js
 * ─────────────
 * 1. Wipe everything (complaints → users → hostels) in safe order
 * 2. Create Admin1 (already exists) + Admin2 (new)
 * 3. Admin1 → 2 hostels, workers, students
 * 4. Admin2 → 3 hostels, workers, students
 * No complaints seeded.
 */

const BASE    = "http://localhost:8080";
const TIMEOUT = 20_000;

// ── Credentials ───────────────────────────────────────────────────────────────
const SA  = { email: "superadmin@hostelfixit.com", password: "SuperAdmin@123" };
const A1  = { email: "admin@hocom.com",            password: "Admin@123"      };
const A2  = { email: "rajiv.admin@hocom.com",       password: "Admin@456"      };

// ── Admin 2 details (will be created by SuperAdmin) ──────────────────────────
const ADMIN2_USER = {
  name: "Rajiv Bhatia", email: A2.email,
  password: A2.password, phone: "9900112233",
};

// ── Hostels ───────────────────────────────────────────────────────────────────
const HOSTELS_A1 = [
  { name: "Sunrise Residency",  address: "12 MG Road, Pune",        totalRooms: 40 },
  { name: "Bluebell Boys PG",   address: "45 Park Street, Pune",    totalRooms: 35 },
];
const HOSTELS_A2 = [
  { name: "Green Valley Hostel",address: "78 NH-48 Bypass, Pune",   totalRooms: 50 },
  { name: "Lakeside PG",        address: "12 Lake View Road, Pune", totalRooms: 30 },
  { name: "Summit Heights",     address: "88 Hill Top Lane, Pune",  totalRooms: 25 },
];

// ── Workers (2 per hostel) ────────────────────────────────────────────────────
// hostelKey is used to assign after hostel creation
const WORKERS = [
  // Admin1 → Sunrise Residency
  { name:"Manoj Tiwari",  email:"manoj.w@hocom.com",   password:"Worker@123", phone:"9711000001" },
  { name:"Suresh Pal",    email:"suresh.w@hocom.com",  password:"Worker@123", phone:"9711000002" },
  // Admin1 → Bluebell Boys PG
  { name:"Vijay Nair",    email:"vijay.w@hocom.com",   password:"Worker@123", phone:"9711000003" },
  { name:"Ravi Dubey",    email:"ravi.w@hocom.com",    password:"Worker@123", phone:"9711000004" },
  // Admin2 → Green Valley
  { name:"Deepak Gupta",  email:"deepak.w@hocom.com",  password:"Worker@123", phone:"9711000005" },
  { name:"Amit Yadav",    email:"amit.w@hocom.com",    password:"Worker@123", phone:"9711000006" },
  // Admin2 → Lakeside PG
  { name:"Ganesh Pawar",  email:"ganesh.w@hocom.com",  password:"Worker@123", phone:"9711000007" },
  { name:"Harish Nair",   email:"harish.w@hocom.com",  password:"Worker@123", phone:"9711000008" },
  // Admin2 → Summit Heights
  { name:"Balram Singh",  email:"balram.w@hocom.com",  password:"Worker@123", phone:"9711000009" },
  { name:"Prem Kumar",    email:"prem.w@hocom.com",    password:"Worker@123", phone:"9711000010" },
];

// ── Wardens (1 per hostel) ────────────────────────────────────────────────────
const WARDENS = [
  // Admin1
  { name:"Ankit Sharma",  email:"warden.sunrise@hocom.com",  password:"Warden@123", phone:"9800000001" },
  { name:"Pooja Mehta",   email:"warden.bluebell@hocom.com", password:"Warden@123", phone:"9800000002" },
  // Admin2
  { name:"Ramesh Iyer",   email:"warden.green@hocom.com",    password:"Warden@123", phone:"9800000003" },
  { name:"Sunita Desai",  email:"warden.lakeside@hocom.com", password:"Warden@123", phone:"9800000004" },
  { name:"Prakash Menon", email:"warden.summit@hocom.com",   password:"Warden@123", phone:"9800000005" },
];

// ── Students (4 per hostel = 20 total) ───────────────────────────────────────
const STUDENTS = [
  // Sunrise Residency
  { name:"Aarav Mehta",   email:"aarav@student.com",    password:"Student@123", phone:"8800000001", room:"101" },
  { name:"Priya Singh",   email:"priya@student.com",    password:"Student@123", phone:"8800000002", room:"102" },
  { name:"Dev Kapoor",    email:"dev@student.com",       password:"Student@123", phone:"8800000003", room:"103" },
  { name:"Sneha Roy",     email:"sneha@student.com",     password:"Student@123", phone:"8800000004", room:"104" },
  // Bluebell Boys PG
  { name:"Rahul Joshi",   email:"rahul@student.com",     password:"Student@123", phone:"8800000005", room:"201" },
  { name:"Kavya Reddy",   email:"kavya@student.com",     password:"Student@123", phone:"8800000006", room:"202" },
  { name:"Nikhil Rao",    email:"nikhil@student.com",    password:"Student@123", phone:"8800000007", room:"203" },
  { name:"Ananya Bose",   email:"ananya@student.com",    password:"Student@123", phone:"8800000008", room:"204" },
  // Green Valley
  { name:"Tanvi Patil",   email:"tanvi@student.com",     password:"Student@123", phone:"8800000009", room:"301" },
  { name:"Rohan Kulkarni",email:"rohan@student.com",     password:"Student@123", phone:"8800000010", room:"302" },
  { name:"Meera Nambiar", email:"meera@student.com",     password:"Student@123", phone:"8800000011", room:"303" },
  { name:"Karan Shah",    email:"karan@student.com",     password:"Student@123", phone:"8800000012", room:"304" },
  // Lakeside PG
  { name:"Aryan Gupta",   email:"aryan@student.com",     password:"Student@123", phone:"8800000013", room:"401" },
  { name:"Simran Kaur",   email:"simran@student.com",    password:"Student@123", phone:"8800000014", room:"402" },
  { name:"Vikram Yadav",  email:"vikram@student.com",    password:"Student@123", phone:"8800000015", room:"403" },
  { name:"Neha Sharma",   email:"neha@student.com",      password:"Student@123", phone:"8800000016", room:"404" },
  // Summit Heights
  { name:"Preethi Nair",  email:"preethi@student.com",   password:"Student@123", phone:"8800000017", room:"501" },
  { name:"Kunal Sinha",   email:"kunal@student.com",     password:"Student@123", phone:"8800000018", room:"502" },
  { name:"Deepika Rao",   email:"deepika@student.com",   password:"Student@123", phone:"8800000019", room:"503" },
  { name:"Aakash Jain",   email:"aakash@student.com",    password:"Student@123", phone:"8800000020", room:"504" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const delay = ms => new Promise(r => setTimeout(r, ms));
const log   = s  => console.log(`\n${"─".repeat(60)}\n${s}`);
const ok    = (l, v) => console.log(`  ✓  ${l}: ${v}`);
const warn  = (l, v) => console.log(`  ⚠  ${l}: ${v}`);

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

async function apiGet(path, token) {
  return fetchJ(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
}

async function apiPost(path, token, body) {
  return fetchJ(`${BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function apiDel(path, token) {
  return fetchJ(`${BASE}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║   HostelFixIT — Fresh Seed (No Complaints)          ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  // ── STEP 1: Login as SuperAdmin ───────────────────────────────────────────
  log("STEP 1 — SuperAdmin Login");
  const saToken = await login(SA.email, SA.password);
  if (!saToken) { console.error("❌ SuperAdmin login failed"); process.exit(1); }
  ok("Logged in", SA.email);

  // ── STEP 2: Login as Admin1 ───────────────────────────────────────────────
  log("STEP 2 — Admin1 Login");
  let a1Token = await login(A1.email, A1.password);
  if (!a1Token) { console.error("❌ Admin1 login failed"); process.exit(1); }
  ok("Logged in", A1.email);

  // ── STEP 3: Wipe existing data — CORRECT ORDER ──────────────────────────
  log("STEP 3 — Wipe: Complaints first");
  // List & delete all complaints scoped to admin1
  const cPage = await apiGet("/api/admin/complaints?size=100&page=0", a1Token);
  const complaints = cPage.data?.content || [];
  let cDeleted = 0;
  for (const c of complaints) {
    // No admin delete endpoint for complaints — nullify by deleting hostel later
    // Just count for now
    cDeleted++;
  }
  ok("Complaints found (will be cascade-deleted with hostels)", cDeleted);

  log("STEP 3b — Wipe: Users (students, workers, wardens)");
  // Get all users scoped to admin1
  let uPage = await apiGet("/api/admin/users?size=100&page=0", a1Token);
  let users = uPage.data?.content || [];
  let uDeleted = 0;
  for (const u of users) {
    const r = await apiDel(`/api/admin/users/${u.id}`, a1Token);
    if (r.ok) { uDeleted++; }
    await delay(150);
  }
  ok("Users deleted", uDeleted);

  log("STEP 3c — Wipe: Hostels (cascades complaints)");
  const hPage = await apiGet("/api/admin/hostels", a1Token);
  const hostels = Array.isArray(hPage.data) ? hPage.data : (hPage.data?.content || []);
  let hDeleted = 0;
  for (const h of hostels) {
    const r = await apiDel(`/api/admin/hostels/${h.id}`, a1Token);
    if (r.ok) { hDeleted++; }
    else warn(`Hostel delete failed ${h.name}`, r.data?.message || r.status);
    await delay(150);
  }
  ok("Hostels deleted", hDeleted);

  // ── STEP 4: Ensure Admin2 exists ─────────────────────────────────────────
  log("STEP 4 — Create / verify Admin2");
  const a2Create = await apiPost("/api/superadmin/admins", saToken, ADMIN2_USER);
  if (a2Create.ok) ok("Created admin2", A2.email);
  else ok("Admin2 already exists (or created)", A2.email);

  let a2Token = await login(A2.email, A2.password);
  if (!a2Token) { console.error("❌ Admin2 login failed"); process.exit(1); }
  ok("Logged in", A2.email);

  // Wipe Admin2's existing data too
  log("STEP 4b — Wipe Admin2 existing data");
  const u2Page = await apiGet("/api/admin/users?size=100&page=0", a2Token);
  const u2List = u2Page.data?.content || [];
  for (const u of u2List) {
    await apiDel(`/api/admin/users/${u.id}`, a2Token);
    await delay(150);
  }
  ok("Admin2 users wiped", u2List.length);

  const h2Page = await apiGet("/api/admin/hostels", a2Token);
  const h2List = Array.isArray(h2Page.data) ? h2Page.data : (h2Page.data?.content || []);
  for (const h of h2List) {
    await apiDel(`/api/admin/hostels/${h.id}`, a2Token);
    await delay(150);
  }
  ok("Admin2 hostels wiped", h2List.length);

  // ── STEP 5: Create Admin1's 2 Hostels ────────────────────────────────────
  log("STEP 5 — Admin1: Create 2 Hostels");
  const a1HostelIds = [];
  for (const h of HOSTELS_A1) {
    const r = await apiPost("/api/admin/hostels", a1Token, h);
    if (r.ok) { a1HostelIds.push(r.data.id); ok("Hostel created", h.name); }
    else { warn("Hostel failed", h.name); a1HostelIds.push(null); }
    await delay(200);
  }

  // ── STEP 6: Create Admin2's 3 Hostels ────────────────────────────────────
  log("STEP 6 — Admin2: Create 3 Hostels");
  const a2HostelIds = [];
  for (const h of HOSTELS_A2) {
    const r = await apiPost("/api/admin/hostels", a2Token, h);
    if (r.ok) { a2HostelIds.push(r.data.id); ok("Hostel created", h.name); }
    else { warn("Hostel failed", h.name); a2HostelIds.push(null); }
    await delay(200);
  }

  // Map: hostelIdx 0-1 → admin1, 2-4 → admin2
  // Workers[0-1] → a1HostelIds[0], Workers[2-3] → a1HostelIds[1]
  // Workers[4-5] → a2HostelIds[0], Workers[6-7] → a2HostelIds[1], Workers[8-9] → a2HostelIds[2]
  const workerHostelMap = [
    { hostelId: a1HostelIds[0], token: a1Token },
    { hostelId: a1HostelIds[0], token: a1Token },
    { hostelId: a1HostelIds[1], token: a1Token },
    { hostelId: a1HostelIds[1], token: a1Token },
    { hostelId: a2HostelIds[0], token: a2Token },
    { hostelId: a2HostelIds[0], token: a2Token },
    { hostelId: a2HostelIds[1], token: a2Token },
    { hostelId: a2HostelIds[1], token: a2Token },
    { hostelId: a2HostelIds[2], token: a2Token },
    { hostelId: a2HostelIds[2], token: a2Token },
  ];

  const wardenHostelMap = [
    { hostelId: a1HostelIds[0], token: a1Token },
    { hostelId: a1HostelIds[1], token: a1Token },
    { hostelId: a2HostelIds[0], token: a2Token },
    { hostelId: a2HostelIds[1], token: a2Token },
    { hostelId: a2HostelIds[2], token: a2Token },
  ];

  // Students: 4 per hostel, 5 hostels = 20
  const studentHostelMap = [
    { hostelId: a1HostelIds[0], token: a1Token },
    { hostelId: a1HostelIds[0], token: a1Token },
    { hostelId: a1HostelIds[0], token: a1Token },
    { hostelId: a1HostelIds[0], token: a1Token },
    { hostelId: a1HostelIds[1], token: a1Token },
    { hostelId: a1HostelIds[1], token: a1Token },
    { hostelId: a1HostelIds[1], token: a1Token },
    { hostelId: a1HostelIds[1], token: a1Token },
    { hostelId: a2HostelIds[0], token: a2Token },
    { hostelId: a2HostelIds[0], token: a2Token },
    { hostelId: a2HostelIds[0], token: a2Token },
    { hostelId: a2HostelIds[0], token: a2Token },
    { hostelId: a2HostelIds[1], token: a2Token },
    { hostelId: a2HostelIds[1], token: a2Token },
    { hostelId: a2HostelIds[1], token: a2Token },
    { hostelId: a2HostelIds[1], token: a2Token },
    { hostelId: a2HostelIds[2], token: a2Token },
    { hostelId: a2HostelIds[2], token: a2Token },
    { hostelId: a2HostelIds[2], token: a2Token },
    { hostelId: a2HostelIds[2], token: a2Token },
  ];

  // ── STEP 7: Create Wardens ────────────────────────────────────────────────
  log("STEP 7 — Create 5 Wardens (1 per hostel)");
  for (let i = 0; i < WARDENS.length; i++) {
    const { hostelId, token } = wardenHostelMap[i];
    if (!hostelId) { warn("Skipping warden (no hostel)", WARDENS[i].name); continue; }
    const r = await apiPost("/api/admin/users", token, {
      ...WARDENS[i], role: "WARDEN", hostelId,
    });
    if (r.ok) ok(`Warden created`, WARDENS[i].name);
    else warn(`Warden failed`, `${WARDENS[i].name}: ${r.data?.message || r.status}`);
    await delay(300);
  }

  // ── STEP 8: Create Workers ────────────────────────────────────────────────
  log("STEP 8 — Create 10 Workers (2 per hostel)");
  for (let i = 0; i < WORKERS.length; i++) {
    const { hostelId, token } = workerHostelMap[i];
    if (!hostelId) { warn("Skipping worker (no hostel)", WORKERS[i].name); continue; }
    const r = await apiPost("/api/admin/users", token, {
      ...WORKERS[i], role: "WORKER", hostelId,
    });
    if (r.ok) ok(`Worker created`, WORKERS[i].name);
    else warn(`Worker failed`, `${WORKERS[i].name}: ${r.data?.message || r.status}`);
    await delay(300);
  }

  // ── STEP 9: Create Students ───────────────────────────────────────────────
  log("STEP 9 — Create 20 Students (4 per hostel)");
  for (let i = 0; i < STUDENTS.length; i++) {
    const { hostelId, token } = studentHostelMap[i];
    if (!hostelId) { warn("Skipping student (no hostel)", STUDENTS[i].name); continue; }
    const r = await apiPost("/api/admin/users", token, {
      ...STUDENTS[i], role: "STUDENT", hostelId, roomNumber: STUDENTS[i].room,
    });
    if (r.ok) ok(`Student created`, STUDENTS[i].name);
    else warn(`Student failed`, `${STUDENTS[i].name}: ${r.data?.message || r.status}`);
    await delay(300);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("✅  FRESH SEED COMPLETE\n");
  console.log("  ┌──────────────────────────────────────────────────────┐");
  console.log("  │  STRUCTURE                                           │");
  console.log("  ├──────────────────────────────────────────────────────┤");
  console.log("  │  SuperAdmin : superadmin@hostelfixit.com             │");
  console.log("  │  Admin 1    : admin@hocom.com         (2 hostels)    │");
  console.log("  │    Sunrise Residency  — 1 warden, 2 workers, 4 stud │");
  console.log("  │    Bluebell Boys PG   — 1 warden, 2 workers, 4 stud │");
  console.log("  │  Admin 2    : rajiv.admin@hocom.com   (3 hostels)    │");
  console.log("  │    Green Valley Hostel— 1 warden, 2 workers, 4 stud │");
  console.log("  │    Lakeside PG        — 1 warden, 2 workers, 4 stud │");
  console.log("  │    Summit Heights     — 1 warden, 2 workers, 4 stud │");
  console.log("  ├──────────────────────────────────────────────────────┤");
  console.log("  │  PASSWORDS                                           │");
  console.log("  │  SuperAdmin  SuperAdmin@123                          │");
  console.log("  │  Admin1      Admin@123                               │");
  console.log("  │  Admin2      Admin@456                               │");
  console.log("  │  Wardens     Warden@123                              │");
  console.log("  │  Workers     Worker@123                              │");
  console.log("  │  Students    Student@123                             │");
  console.log("  └──────────────────────────────────────────────────────┘\n");
}

run().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
