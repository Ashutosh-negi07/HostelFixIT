#!/usr/bin/env node
/**
 * HostelFixIT — Database Seeding Script
 * 
 * Seeds realistic sample data via the REST API:
 * - 2 Hostels
 * - 2 Wardens (one per hostel)
 * - 4 Workers (2 per hostel)
 * - 8 Students (4 per hostel)
 * - 16 Complaints across all statuses and categories
 * - Assignments, resolutions, and feedback
 * 
 * Run: node seed.js
 * Requires: backend at localhost:8080, admin creds as below
 */

const BASE = "http://localhost:8080";
const ADMIN_EMAIL = "admin@hocom.com";
const ADMIN_PASSWORD = "Admin@123";

// ── helpers ───────────────────────────────────────────────────────────────

let adminToken = "";

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
  if (!res.ok) {
    console.warn(`  ⚠  ${method} ${path} → ${res.status}:`, typeof data === "object" ? data.message || data : data);
    return null;
  }
  return data;
}

function log(msg) { console.log(`\n${"─".repeat(60)}\n${msg}`); }
function ok(label, val) { console.log(`  ✅ ${label}:`, typeof val === "object" ? val?.name || val?.id || "done" : val); }

// ── seed data ─────────────────────────────────────────────────────────────

const HOSTELS = [
  { name: "Ganga Hostel",  address: "Block A, Main Campus, North Wing" },
  { name: "Yamuna Hostel", address: "Block B, Main Campus, South Wing" },
];

const WARDENS = [
  { name: "Rajesh Kumar",  email: "warden.ganga@hostelfixit.com",  password: "Warden@123", phone: "9876543001" },
  { name: "Priya Sharma",  email: "warden.yamuna@hostelfixit.com", password: "Warden@123", phone: "9876543002" },
];

const WORKERS = [
  { name: "Mohan Singh",    email: "worker1.ganga@hostelfixit.com",  password: "Worker@123", phone: "9876543011" },
  { name: "Suresh Yadav",   email: "worker2.ganga@hostelfixit.com",  password: "Worker@123", phone: "9876543012" },
  { name: "Ravi Patil",     email: "worker1.yamuna@hostelfixit.com", password: "Worker@123", phone: "9876543013" },
  { name: "Kiran Nair",     email: "worker2.yamuna@hostelfixit.com", password: "Worker@123", phone: "9876543014" },
];

const STUDENTS = [
  { name: "Aarav Mehta",    email: "aarav@student.com",   password: "Student@123", phone: "9876540001" },
  { name: "Isha Gupta",     email: "isha@student.com",    password: "Student@123", phone: "9876540002" },
  { name: "Dev Patel",      email: "dev@student.com",     password: "Student@123", phone: "9876540003" },
  { name: "Ananya Roy",     email: "ananya@student.com",  password: "Student@123", phone: "9876540004" },
  { name: "Rohan Verma",    email: "rohan@student.com",   password: "Student@123", phone: "9876540005" },
  { name: "Sneha Iyer",     email: "sneha@student.com",   password: "Student@123", phone: "9876540006" },
  { name: "Arjun Das",      email: "arjun@student.com",   password: "Student@123", phone: "9876540007" },
  { name: "Kavya Reddy",    email: "kavya@student.com",   password: "Student@123", phone: "9876540008" },
];

const COMPLAINTS_TEMPLATE = [
  { desc: "Bathroom tap leaking continuously for 3 days. Water is being wasted and the floor is always wet.", cat: "Plumbing",    priority: "HIGH",   status: "RESOLVED" },
  { desc: "Ceiling fan in room 204 is making loud rattling noise and vibrating dangerously.",                cat: "Maintenance", priority: "HIGH",   status: "IN_PROGRESS" },
  { desc: "Room light bulb fused. Been dark for 2 days. Cannot study at night.",                            cat: "Electrical",  priority: "NORMAL", status: "ASSIGNED" },
  { desc: "Corridor near room 108 has not been cleaned for a week. Dusty and smells bad.",                  cat: "Cleaning",    priority: "LOW",    status: "RESOLVED" },
  { desc: "Study table in my room is broken. Leg snapped off and table is unusable.",                       cat: "Furniture",   priority: "NORMAL", status: "PENDING" },
  { desc: "WiFi router on floor 3 not working since yesterday. Cannot attend online classes.",              cat: "Internet",    priority: "HIGH",   status: "RESOLVED" },
  { desc: "Door lock of room 312 is jammed. Cannot lock the room properly. Security risk.",                 cat: "Security",    priority: "HIGH",   status: "ASSIGNED" },
  { desc: "Hot water geyser in bathroom block not heating water. Cold showers in winter.",                  cat: "Plumbing",    priority: "NORMAL", status: "IN_PROGRESS" },
  { desc: "Power socket near bed sparking when plugging in charger. Potential fire hazard.",                cat: "Electrical",  priority: "HIGH",   status: "PENDING" },
  { desc: "Hostel entrance gate hinge broken. Gate hanging loose and making noise all night.",              cat: "Maintenance", priority: "NORMAL", status: "RESOLVED" },
  { desc: "Dining hall chairs are broken in multiple places. Several cannot be sat on safely.",             cat: "Furniture",   priority: "LOW",    status: "PENDING" },
  { desc: "Drainage in bathroom blocked. Water not draining. Standing water for 2 days.",                  cat: "Plumbing",    priority: "HIGH",   status: "REJECTED" },
  { desc: "Common room TV remote lost and display flickering. Cannot watch news.",                         cat: "Maintenance", priority: "LOW",    status: "PENDING" },
  { desc: "Internet speed extremely slow since last week. Barely able to load emails.",                    cat: "Internet",    priority: "NORMAL", status: "ASSIGNED" },
  { desc: "Corridor light outside room 205 not working. Very dark and unsafe at night.",                   cat: "Electrical",  priority: "NORMAL", status: "RESOLVED" },
  { desc: "Washroom door hinge broken. Door falls off when opening. Privacy issue.",                       cat: "Security",    priority: "HIGH",   status: "PENDING" },
];

const FEEDBACK_DATA = [
  { rating: 5, comment: "Fixed very quickly! Worker was professional and polite. Thank you!" },
  { rating: 4, comment: "Good work but took 3 days to resolve. Could be faster." },
  { rating: 5, comment: "Excellent service. Cleaned thoroughly and on time." },
  { rating: 3, comment: "Got resolved but had to follow up twice." },
  { rating: 5, comment: "Worker arrived same day. Impressive response time." },
];

// ── main seeding logic ────────────────────────────────────────────────────

async function seed() {
  console.log("\n🌱 HostelFixIT Database Seeder\n" + "=".repeat(60));

  // 1. Admin login
  log("1. Admin Login");
  const auth = await req("POST", "/api/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (!auth?.token) { console.error("❌ Admin login failed. Is backend running?"); process.exit(1); }
  adminToken = auth.token;
  ok("Logged in as admin", auth.name);

  // 2. Fetch existing categories
  log("2. Fetching Default Categories");
  const categories = await req("GET", "/api/admin/categories");
  const catMap = {};
  (Array.isArray(categories) ? categories : categories?.content || []).forEach(c => { catMap[c.name] = c.id; });
  ok("Categories loaded", Object.keys(catMap).join(", "));

  // 3. Create hostels
  log("3. Creating Hostels");
  const hostelIds = [];
  for (const h of HOSTELS) {
    // Check if exists
    const existing = await req("GET", "/api/admin/hostels");
    const list = Array.isArray(existing) ? existing : existing?.content || [];
    const found = list.find(x => x.name === h.name);
    if (found) {
      ok(`Hostel already exists`, h.name);
      hostelIds.push(found.id);
    } else {
      const created = await req("POST", "/api/admin/hostels", h);
      if (created?.id) { ok("Created hostel", h.name); hostelIds.push(created.id); }
      else hostelIds.push(null);
    }
  }

  // 4. Create wardens
  log("4. Creating Wardens");
  const wardenIds = [];
  for (let i = 0; i < WARDENS.length; i++) {
    const w = { ...WARDENS[i], role: "WARDEN", hostelId: hostelIds[i] };
    const created = await req("POST", "/api/admin/users", w);
    if (created?.id) { ok(`Warden for ${HOSTELS[i].name}`, WARDENS[i].name); wardenIds.push(created.id); }
    else { console.log(`  ℹ  ${WARDENS[i].name} may already exist`); wardenIds.push(null); }
  }

  // 5. Create workers (2 per hostel)
  log("5. Creating Workers");
  const workerIds = [[], []]; // workerIds[hostelIndex]
  for (let i = 0; i < WORKERS.length; i++) {
    const hostelIdx = i < 2 ? 0 : 1;
    const w = { ...WORKERS[i], role: "WORKER", hostelId: hostelIds[hostelIdx] };
    const created = await req("POST", "/api/admin/users", w);
    if (created?.id) { ok(`Worker → ${HOSTELS[hostelIdx].name}`, WORKERS[i].name); workerIds[hostelIdx].push(created.id); }
    else { console.log(`  ℹ  ${WORKERS[i].name} may already exist`); }
  }

  // If workers already existed, fetch them
  for (let hi = 0; hi < 2; hi++) {
    if (workerIds[hi].length === 0 && hostelIds[hi]) {
      const wres = await req("GET", `/api/admin/hostels/${hostelIds[hi]}/workers`);
      const wlist = wres?.content || [];
      workerIds[hi] = wlist.map(w => w.id);
      console.log(`  ℹ  Fetched ${workerIds[hi].length} existing workers for ${HOSTELS[hi].name}`);
    }
  }

  // 6. Create students (4 per hostel)
  log("6. Creating Students");
  const studentTokens = [[], []]; // [hostelIdx][studentIdx] = {token, id}
  for (let i = 0; i < STUDENTS.length; i++) {
    const hostelIdx = i < 4 ? 0 : 1;
    const s = { ...STUDENTS[i], role: "STUDENT", hostelId: hostelIds[hostelIdx] };
    const created = await req("POST", "/api/admin/users", s);
    if (created?.id) {
      ok(`Student → ${HOSTELS[hostelIdx].name}`, STUDENTS[i].name);
      // Login as student to get their token
      const sauth = await req("POST", "/api/auth/login", { email: STUDENTS[i].email, password: STUDENTS[i].password });
      if (sauth?.token) studentTokens[hostelIdx].push({ token: sauth.token, id: created.id, name: STUDENTS[i].name });
    } else {
      console.log(`  ℹ  ${STUDENTS[i].name} may already exist, trying login...`);
      const sauth = await req("POST", "/api/auth/login", { email: STUDENTS[i].email, password: STUDENTS[i].password });
      if (sauth?.token) studentTokens[hostelIdx].push({ token: sauth.token, id: sauth.userId, name: STUDENTS[i].name });
    }
  }

  // 7. File complaints as students
  log("7. Filing Complaints");
  const complaintIds = []; // { id, hostelIdx, status, studentToken, wardenToken }

  // Login wardens
  const wardenTokens = [];
  for (const w of WARDENS) {
    const wa = await req("POST", "/api/auth/login", { email: w.email, password: w.password });
    wardenTokens.push(wa?.token || null);
  }

  let ci = 0;
  for (const tmpl of COMPLAINTS_TEMPLATE) {
    const hostelIdx = ci % 2; // alternate hostels
    const students = studentTokens[hostelIdx];
    if (!students || students.length === 0) { ci++; continue; }
    const student = students[ci % students.length];
    const catId = catMap[tmpl.cat];
    if (!catId) { ci++; continue; }

    // Post as form data (no photo for seed)
    const formData = new URLSearchParams({
      categoryId: catId,
      description: tmpl.desc,
      priority: tmpl.priority,
    });
    const headers = {
      "Authorization": `Bearer ${student.token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };
    const res = await fetch(`${BASE}/api/student/complaints`, {
      method: "POST",
      headers,
      body: formData,
    });
    const data = await res.json().catch(() => null);
    if (data?.id) {
      ok(`Complaint #${ci+1} [${tmpl.priority}/${tmpl.status}]`, tmpl.desc.substring(0, 40) + "...");
      complaintIds.push({ id: data.id, hostelIdx, status: tmpl.status, studentToken: student.token, catName: tmpl.cat });
    } else {
      console.warn(`  ⚠  Failed to create complaint ${ci+1}`, res.status);
    }
    ci++;
    // Small delay to avoid overwhelming
    await new Promise(r => setTimeout(r, 100));
  }

  // 8. Warden actions (assign / reject)
  log("8. Warden — Assigning & Rejecting Complaints");
  let feedbackQueue = [];

  for (const c of complaintIds) {
    const wardenToken = wardenTokens[c.hostelIdx];
    const workers = workerIds[c.hostelIdx];
    if (!wardenToken) continue;

    const h = { "Authorization": `Bearer ${wardenToken}`, "Content-Type": "application/json" };

    if (c.status === "REJECTED") {
      const r = await fetch(`${BASE}/api/warden/complaints/${c.id}/reject`, { method: "PUT", headers: h });
      if (r.ok) ok("Rejected complaint", c.id.substring(0,8) + "...");
    } else if (["ASSIGNED", "IN_PROGRESS", "RESOLVED"].includes(c.status) && workers.length > 0) {
      const workerId = workers[Math.floor(Math.random() * workers.length)];
      const r = await fetch(`${BASE}/api/warden/complaints/${c.id}/assign`, {
        method: "PUT", headers: h,
        body: JSON.stringify({ workerId }),
      });
      if (r.ok) {
        ok("Assigned complaint", c.id.substring(0,8) + "...");
        c.workerId = workerId;
      }
    }
    await new Promise(r => setTimeout(r, 80));
  }

  // 9. Worker — start & resolve
  log("9. Workers — Starting and Resolving Tasks");

  // Build worker token map
  const workerTokenMap = {};
  for (const w of WORKERS) {
    const wa = await req("POST", "/api/auth/login", { email: w.email, password: w.password });
    if (wa?.token) workerTokenMap[wa.userId] = wa.token;
  }

  for (const c of complaintIds) {
    if (!["IN_PROGRESS", "RESOLVED"].includes(c.status)) continue;
    if (!c.workerId || !workerTokenMap[c.workerId]) continue;

    const wToken = workerTokenMap[c.workerId];
    const h = { "Authorization": `Bearer ${wToken}`, "Content-Type": "application/json" };

    // Start progress
    const r1 = await fetch(`${BASE}/api/worker/complaints/${c.id}/in-progress`, { method: "PUT", headers: h });
    if (r1.ok) ok("In-progress →", c.id.substring(0,8) + "...");
    await new Promise(r => setTimeout(r, 80));

    if (c.status === "RESOLVED") {
      const r2 = await fetch(`${BASE}/api/worker/complaints/${c.id}/resolve`, { method: "PUT", headers: h });
      if (r2.ok) {
        ok("Resolved ✅", c.id.substring(0,8) + "...");
        feedbackQueue.push({ complaintId: c.id, studentToken: c.studentToken });
      }
      await new Promise(r => setTimeout(r, 80));
    }
  }

  // 10. Students leave feedback on resolved complaints
  log("10. Students — Leaving Feedback");
  let fi = 0;
  for (const fb of feedbackQueue) {
    const fbData = FEEDBACK_DATA[fi % FEEDBACK_DATA.length];
    const h = { "Authorization": `Bearer ${fb.studentToken}`, "Content-Type": "application/json" };
    const r = await fetch(`${BASE}/api/student/feedback`, {
      method: "POST", headers: h,
      body: JSON.stringify({ complaintId: fb.complaintId, rating: fbData.rating, comment: fbData.comment }),
    });
    if (r.ok) ok(`Rating ${fbData.rating}⭐`, fbData.comment.substring(0, 40) + "...");
    fi++;
    await new Promise(r => setTimeout(r, 80));
  }

  // 11. Final summary
  log("11. ✅ Seeding Complete!");
  console.log(`
  Hostels created:    ${hostelIds.filter(Boolean).length}
  Wardens:            ${WARDENS.length}
  Workers:            ${WORKERS.length}  
  Students:           ${STUDENTS.length}
  Complaints filed:   ${complaintIds.length}
  Feedback entries:   ${feedbackQueue.length}

  ─────────────────────────────────────────────
  🔐 Login Credentials:
  
  ADMIN:
    Email:    admin@hocom.com
    Password: Admin@123
    URL:      http://localhost:3000 → /admin
  
  WARDEN (Ganga Hostel):
    Email:    warden.ganga@hostelfixit.com
    Password: Warden@123
    URL:      http://localhost:3000 → /warden

  WARDEN (Yamuna Hostel):
    Email:    warden.yamuna@hostelfixit.com
    Password: Warden@123

  WORKER (Ganga):
    Email:    worker1.ganga@hostelfixit.com
    Password: Worker@123
    URL:      http://localhost:3000 → /worker

  STUDENT:
    Email:    aarav@student.com
    Password: Student@123
    URL:      http://localhost:3000 → /student
  ─────────────────────────────────────────────
  `);
}

seed().catch(e => { console.error("❌ Seeder crashed:", e); process.exit(1); });
