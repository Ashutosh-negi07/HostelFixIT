import api from "@/lib/api";

/** POST /api/student/feedback */
export async function submitFeedback({ complaintId, rating, comment }) {
  const res = await api.post("/api/student/feedback", { complaintId, rating, comment });
  return res.data;
}

/** GET .../complaints/{id}/feedback */
export async function getFeedback(role, complaintId) {
  const base = { STUDENT: "/api/student", WARDEN: "/api/warden", WORKER: "/api/worker", ADMIN: "/api/admin" }[role] || "/api/student";
  const res = await api.get(`${base}/complaints/${complaintId}/feedback`);
  return res.data;
}
