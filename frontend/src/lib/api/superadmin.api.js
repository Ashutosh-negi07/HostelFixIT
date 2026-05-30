import api from "@/lib/api";

// ═══════════════════════════════════════
//  GLOBAL STATS
// ═══════════════════════════════════════

/** GET /api/superadmin/stats */
export async function getGlobalStats() {
  const res = await api.get("/api/superadmin/stats");
  return res.data; // { totalAdmins, totalWardens, totalWorkers, totalStudents, totalHostels, totalUsers }
}

// ═══════════════════════════════════════
//  ADMIN MANAGEMENT
// ═══════════════════════════════════════

/** GET /api/superadmin/admins */
export async function getAllAdmins(params = {}) {
  const res = await api.get("/api/superadmin/admins", { params });
  return res.data; // PagedResponse<UserResponse>
}

/** POST /api/superadmin/admins */
export async function createAdmin(data) {
  const res = await api.post("/api/superadmin/admins", { ...data, role: "ADMIN" });
  return res.data;
}

/** PUT /api/superadmin/admins/{id} */
export async function updateAdmin(id, data) {
  const res = await api.put(`/api/superadmin/admins/${id}`, data);
  return res.data;
}

/** DELETE /api/superadmin/admins/{id} */
export async function deleteAdmin(id) {
  const res = await api.delete(`/api/superadmin/admins/${id}`);
  return res.data;
}

/** PUT /api/superadmin/admins/{id}/toggle */
export async function toggleAdmin(id) {
  const res = await api.put(`/api/superadmin/admins/${id}/toggle`);
  return res.data;
}

// ═══════════════════════════════════════
//  HOSTEL MANAGEMENT (GLOBAL)
// ═══════════════════════════════════════

/** GET /api/superadmin/hostels — ALL hostels regardless of admin */
export async function getAllHostelsGlobal() {
  const res = await api.get("/api/superadmin/hostels");
  return res.data; // List<HostelResponse>
}

/** POST /api/superadmin/hostels */
export async function createHostelGlobal(data) {
  const res = await api.post("/api/superadmin/hostels", data);
  return res.data;
}

/** PUT /api/superadmin/hostels/{hostelId}/assign  — body: { adminId } */
export async function assignHostelToAdmin(hostelId, adminId) {
  const res = await api.put(`/api/superadmin/hostels/${hostelId}/assign`, { adminId });
  return res.data;
}

/** PUT /api/superadmin/hostels/{hostelId}/unassign */
export async function unassignHostel(hostelId) {
  const res = await api.put(`/api/superadmin/hostels/${hostelId}/unassign`);
  return res.data;
}

/** DELETE /api/superadmin/hostels/{hostelId} */
export async function deleteHostelGlobal(hostelId) {
  const res = await api.delete(`/api/superadmin/hostels/${hostelId}`);
  return res.data;
}
