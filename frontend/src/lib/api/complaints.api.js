import api from "@/lib/api";

/** GET /api/student/complaints or /api/warden/complaints or /api/worker/complaints or /api/admin/complaints */
export async function getComplaints(role, params = {}) {
  const base = roleBase(role);
  const res = await api.get(`${base}/complaints`, { params });
  return res.data; // PagedResponse<ComplaintResponse>
}

/** GET .../complaints/{id} */
export async function getComplaint(role, id) {
  const base = roleBase(role);
  const res = await api.get(`${base}/complaints/${id}`);
  return res.data;
}

/** POST /api/student/complaints (multipart) */
export async function createComplaint(formData) {
  const res = await api.post("/api/student/complaints", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/** PUT /api/student/complaints/{id} (multipart) */
export async function updateComplaint(id, formData) {
  const res = await api.put(`/api/student/complaints/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/** DELETE /api/student/complaints/{id} */
export async function cancelComplaint(id) {
  const res = await api.delete(`/api/student/complaints/${id}`);
  return res.data;
}

/** GET /api/student/complaints/count  or /api/worker/complaints/count */
export async function getComplaintCounts(role) {
  const base = roleBase(role);
  const res = await api.get(`${base}/complaints/count`);
  return res.data; // { pending, assigned, inProgress, resolved, rejected, total }
}

// ── Warden actions ───────────────────────────────
/** PUT /api/warden/complaints/{id}/assign */
export async function assignWorker(complaintId, workerId) {
  const res = await api.put(`/api/warden/complaints/${complaintId}/assign`, { workerId });
  return res.data;
}

/** PUT /api/warden/complaints/{id}/reassign */
export async function reassignWorker(complaintId, workerId) {
  const res = await api.put(`/api/warden/complaints/${complaintId}/reassign`, { workerId });
  return res.data;
}

/** PUT /api/warden/complaints/{id}/reject */
export async function rejectComplaint(complaintId) {
  const res = await api.put(`/api/warden/complaints/${complaintId}/reject`);
  return res.data;
}

/** GET /api/warden/complaints/{id}/history */
export async function getComplaintHistory(role, complaintId) {
  const base = roleBase(role);
  const res = await api.get(`${base}/complaints/${complaintId}/history`);
  return res.data; // List<ComplaintStatusHistoryResponse>
}

// ── Worker actions ────────────────────────────────
/** PUT /api/worker/complaints/{id}/in-progress */
export async function startProgress(complaintId) {
  const res = await api.put(`/api/worker/complaints/${complaintId}/in-progress`);
  return res.data;
}

/** PUT /api/worker/complaints/{id}/resolve */
export async function resolveComplaint(complaintId) {
  const res = await api.put(`/api/worker/complaints/${complaintId}/resolve`);
  return res.data;
}

// ── Helpers ────────────────────────────────────────
function roleBase(role) {
  const map = { STUDENT: "/api/student", WARDEN: "/api/warden", WORKER: "/api/worker", ADMIN: "/api/admin" };
  return map[role] || "/api/student";
}
