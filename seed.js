#!/usr/bin/env node
/**
 * HostelFixIT — Clean Reset + Reseed (Users Only, No Complaints)
 *
 * 1. Deletes all non-admin users
 * 2. Deletes all hostels
 * 3. Creates 3 hostels
 * 4. Creates wardens, workers, students per hostel
 */

const BASE = "http://localhost:8080";
const ADMIN_EMAIL = "admin@hocom.com";
const ADMIN_PASSWORD = "Admin@123";

let adminToken = "";

// ── helpers ──────────────────────────────────────────────────────────────────

async function req(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token || adminToken) headers["Authorization"] = `Bearer ${token || adminToken}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok && res.status !== 404) {
    console.warn(`  ⚠  ${method} ${path} → ${res.status}:`, typeof data === "object" ? (data.message || data.error || JSON.stringify(data)) : data);
    return null;
  }
  return data;
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));
function log(msg) { console.log(`\n${"─".repeat(60)}\n${msg}`); }
function ok(label, val) { console.log(`  ✅ ${label}:`, val || "done"); }
function info(msg) { console.log(`  ℹ  ${msg}`); }

// ── seed data ─────────────────────────────────────────────────────────────────

const HOSTELS = [
  { name: "Sunrise Residency",  address: "Block A, North Campus, Sector 12" },
  { name: "Bluebell Boys PG",   address: "Block B, South Campus, Sector 7"  },
  { name: "Green Valley Hostel",address: "Block C, East Campus, Sector 21"  },
];

// 1 Warden per hostel
const WARDENS = [
  { name: "Ankit Sharma",   email: "warden.sunrise@hostelfixit.com",  password: "Warden@123", phone: 9876540101 },
  { name: "Pooja Mehta",    email: "warden.bluebell@hostelfixit.com", password: "Warden@123", phone: 9876540102 },
  { name: "Ramesh Iyer",    email: "warden.valley@hostelfixit.com",   password: "Warden@123", phone: 9876540103 },
];

// 2 Workers per hostel (index 0-1 → hostel 0, 2-3 → hostel 1, 4-5 → hostel 2)
const WORKERS = [
  { name: "Manoj Tiwari",   email: "worker1.sunrise@hostelfixit.com",  password: "Worker@123", phone: 9876541001 },
  { name: "Suresh Pal",     email: "worker2.sunrise@hostelfixit.com",  password: "Worker@123", phone: 9876541002 },
  { name: "Vijay Nair",     email: "worker1.bluebell@hostelfixit.com", password: "Worker@123", phone: 9876541003 },
  { name: "Ravi Dubey",     email: "worker2.bluebell@hostelfixit.com", password: "Worker@123", phone: 9876541004 },
  { name: "Deepak Gupta",   email: "worker1.valley@hostelfixit.com",   password: "Worker@123", phone: 9876541005 },
  { name: "Amit Yadav",     email: "worker2.valley@hostelfixit.com",   password: "Worker@123", phone: 9876541006 },
];

// 5 Students per hostel (index 0-4 → hostel 0, 5-9 → hostel 1, 10-14 → hostel 2)
const STUDENTS = [
  // Sunrise Residency students
  { name: "Aarav Mehta",   email: "aarav@student.com",    password: "Student@123", phone: 9876550001 },
  { name: "Priya Singh",   email: "priya@student.com",    password: "Student@123", phone: 9876550002 },
  { name: "Dev Kapoor",    email: "dev@student.com",      password: "Student@123", phone: 9876550003 },
  { name: "Sneha Roy",     email: "sneha@student.com",    password: "Student@123", phone: 9876550004 },
  { name: "Arjun Das",     email: "arjun@student.com",    password: "Student@123", phone: 9876550005 },
  // Bluebell Boys PG students
  { name: "Rahul Joshi",   email: "rahul@student.com",    password: "Student@123", phone: 9876550006 },
  { name: "Kavya Reddy",   email: "kavya@student.com",    password: "Student@123", phone: 9876550007 },
  { name: "Nikhil Rao",    email: "nikhil@student.com",   password: "Student@123", phone: 9876550008 },
  { name: "Ananya Bose",   email: "ananya@student.com",   password: "Student@123", phone: 9876550009 },
  { name: "Ishaan Verma",  email: "ishaan@student.com",   password: "Student@123", phone: 9876550010 },
  // Green Valley Hostel students
  { name: "Tanvi Patil",   email: "tanvi@student.com",    password: "Student@123", phone: 9876550011 },
  { name: "Rohan Kulkarni",email: "rohan@student.com",    password: "Student@123", phone: 9876550012 },
  { name: "Meera Nambiar", email: "meera@student.com",    password: "Student@123", phone: 9876550013 },
  { name: "Karan Shah",    email: "karan@student.com",    password: "Student@123", phone: 9876550014 },
  { name: "Divya Menon",   email: "divya@student.com",    password: "Student@123", phone: 9876550015 },
];

// ── main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log("\n🧹 HostelFixIT — Clean Reset + Reseed\n" + "=".repeat(60));

  // ── Step 1: Admin login ───────────────────────────────────────────────────
  log("1. Admin Login");
  const auth = await req("POST", "/api/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (!auth?.token) { console.error("❌ Admin login failed. Is backend running at localhost:8080?"); process.exit(1); }
  adminToken = auth.token;
  ok("Logged in as", auth.name);

  // ── Step 2: Delete all non-admin users ────────────────────────────────────
  log("2. Deleting All Non-Admin Users");
  let deletedUsers = 0;
  let page = 0;
  while (true) {
    const res = await req("GET", `/api/admin/users?page=${page}&size=50`);
    const users = res?.content || [];
    if (users.length === 0) break;
    for (const u of users) {
      if (u.email === ADMIN_EMAIL) { info(`Skipping admin: ${u.email}`); continue; }
      const del = await req("DELETE", `/api/admin/users/${u.id}`);
      if (del !== null) { info(`Deleted: ${u.name} (${u.role})`); deletedUsers++; }
      await delay(60);
    }
    if (res.last) break;
    // Don't advance page since items were deleted
  }
  ok("Users deleted", deletedUsers);

  // ── Step 3: Delete all hostels ────────────────────────────────────────────
  log("3. Deleting All Hostels");
  let deletedHostels = 0;
  const hostelRes = await req("GET", "/api/admin/hostels");
  const hostels = Array.isArray(hostelRes) ? hostelRes : hostelRes?.content || [];
  for (const h of hostels) {
    const del = await req("DELETE", `/api/admin/hostels/${h.id}`);
    if (del !== null) { info(`Deleted hostel: ${h.name}`); deletedHostels++; }
    await delay(60);
  }
  ok("Hostels deleted", deletedHostels);

  // ── Step 4: Create hostels ────────────────────────────────────────────────
  log("4. Creating Hostels");
  const hostelIds = [];
  for (const h of HOSTELS) {
    const created = await req("POST", "/api/admin/hostels", h);
    if (created?.id) { ok("Created hostel", h.name); hostelIds.push(created.id); }
    else { console.error(`❌ Failed to create hostel: ${h.name}`); process.exit(1); }
    await delay(100);
  }

  // ── Step 5: Create wardens (1 per hostel) ─────────────────────────────────
  log("5. Creating Wardens");
  for (let i = 0; i < WARDENS.length; i++) {
    const body = { ...WARDENS[i], role: "WARDEN", hostelId: hostelIds[i] };
    const created = await req("POST", "/api/admin/users", body);
    if (created) ok(`Warden → ${HOSTELS[i].name}`, WARDENS[i].name);
    await delay(100);
  }

  // ── Step 6: Create workers (2 per hostel) ─────────────────────────────────
  log("6. Creating Workers");
  for (let i = 0; i < WORKERS.length; i++) {
    const hostelIdx = Math.floor(i / 2);
    const body = { ...WORKERS[i], role: "WORKER", hostelId: hostelIds[hostelIdx] };
    const created = await req("POST", "/api/admin/users", body);
    if (created) ok(`Worker → ${HOSTELS[hostelIdx].name}`, WORKERS[i].name);
    await delay(100);
  }

  // ── Step 7: Create students (5 per hostel) ────────────────────────────────
  log("7. Creating Students");
  for (let i = 0; i < STUDENTS.length; i++) {
    const hostelIdx = Math.floor(i / 5);
    const body = { ...STUDENTS[i], role: "STUDENT", hostelId: hostelIds[hostelIdx] };
    const created = await req("POST", "/api/admin/users", body);
    if (created) ok(`Student → ${HOSTELS[hostelIdx].name}`, STUDENTS[i].name);
    await delay(100);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  log("✅ DONE — Database Reset Complete");
  console.log(`
  ┌─────────────────────────────────────────────────┐
  │  WHAT'S IN THE DATABASE NOW                     │
  ├─────────────────────────────────────────────────┤
  │  Hostels : 3                                    │
  │  Wardens : 3  (1 per hostel)                    │
  │  Workers : 6  (2 per hostel)                    │
  │  Students: 15 (5 per hostel)                    │
  │  Complaints: 0 (none seeded)                    │
  │  Feedback  : 0                                  │
  ├─────────────────────────────────────────────────┤
  │  LOGIN CREDENTIALS                              │
  ├─────────────────────────────────────────────────┤
  │  ADMIN                                          │
  │    admin@hocom.com        Admin@123             │
  │                                                 │
  │  WARDENS                                        │
  │    warden.sunrise@hostelfixit.com  Warden@123   │
  │    warden.bluebell@hostelfixit.com Warden@123   │
  │    warden.valley@hostelfixit.com   Warden@123   │
  │                                                 │
  │  WORKERS                                        │
  │    worker1.sunrise@hostelfixit.com Worker@123   │
  │    worker1.bluebell@hostelfixit.com Worker@123  │
  │    worker1.valley@hostelfixit.com  Worker@123   │
  │                                                 │
  │  STUDENTS (sample)                              │
  │    aarav@student.com      Student@123           │
  │    rahul@student.com      Student@123           │
  │    tanvi@student.com      Student@123           │
  └─────────────────────────────────────────────────┘
  `);
}

run().catch(e => { console.error("❌ Script crashed:", e.message); process.exit(1); });
