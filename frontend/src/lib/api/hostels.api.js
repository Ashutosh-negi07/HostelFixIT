import api from "@/lib/api";

export async function getAllHostels() {
  const res = await api.get("/api/admin/hostels");
  return res.data;
}

export async function getHostelById(id) {
  const res = await api.get(`/api/admin/hostels/${id}`);
  return res.data;
}

export async function createHostel({ name, address }) {
  const res = await api.post("/api/admin/hostels", { name, address });
  return res.data;
}

export async function updateHostel(id, { name, address }) {
  const res = await api.put(`/api/admin/hostels/${id}`, { name, address });
  return res.data;
}

export async function deleteHostel(id) {
  const res = await api.delete(`/api/admin/hostels/${id}`);
  return res.data;
}

export async function getHostelUsers(hostelId, role, params = {}) {
  const roleMap = { WARDEN: "wardens", STUDENT: "students", WORKER: "workers" };
  const res = await api.get(`/api/admin/hostels/${hostelId}/${roleMap[role]}`, { params });
  return res.data;
}

/** Student: GET /api/student/hostel */
export async function getMyHostel() {
  const res = await api.get("/api/student/hostel");
  return res.data;
}
