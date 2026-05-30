import api from "@/lib/api";

/** GET /api/admin/users or /api/warden/students|workers */
export async function getUsers(role, targetRole, params = {}) {
  if (role === "ADMIN") {
    if (targetRole) {
      const res = await api.get(`/api/admin/users/role/${targetRole}`, { params });
      return res.data;
    }
    const res = await api.get("/api/admin/users", { params });
    return res.data;
  }
  // Warden
  const path = targetRole === "STUDENT" ? "/api/warden/students" : "/api/warden/workers";
  const res = await api.get(path, { params });
  return res.data;
}

/** GET /api/admin/users/{id} or /api/warden/users/{id} */
export async function getUserById(role, id) {
  const base = role === "ADMIN" ? "/api/admin" : "/api/warden";
  const res = await api.get(`${base}/users/${id}`);
  return res.data;
}

/** POST /api/admin/users or /api/warden/users */
export async function createUser(role, data) {
  const base = role === "ADMIN" ? "/api/admin" : "/api/warden";
  const res = await api.post(`${base}/users`, data);
  return res.data;
}

/** PUT /api/admin/users/{id} or /api/warden/users/{id} */
export async function updateUser(role, id, data) {
  const base = role === "ADMIN" ? "/api/admin" : "/api/warden";
  const res = await api.put(`${base}/users/${id}`, data);
  return res.data;
}

/** DELETE */
export async function deleteUser(role, id) {
  const base = role === "ADMIN" ? "/api/admin" : "/api/warden";
  const res = await api.delete(`${base}/users/${id}`);
  return res.data;
}

/** PUT /api/admin/users/{id}/toggle-active */
export async function toggleUserActive(id) {
  const res = await api.put(`/api/admin/users/${id}/toggle-active`);
  return res.data;
}

/** GET profile — role-scoped */
export async function getProfile(role) {
  if (role === "SUPER_ADMIN") {
    const res = await api.get("/api/superadmin/me");
    return res.data;
  }
  const base = {
    ADMIN:   "/api/admin",
    STUDENT: "/api/student",
    WARDEN:  "/api/warden",
    WORKER:  "/api/worker",
  }[role];
  const res = await api.get(`${base}/profile`);
  return res.data;
}

/** PUT profile — role-scoped */
export async function updateProfile(role, data) {
  if (role === "SUPER_ADMIN") {
    const res = await api.put("/api/superadmin/me", data);
    return res.data;
  }
  const base = {
    ADMIN:   "/api/admin",
    STUDENT: "/api/student",
    WARDEN:  "/api/warden",
    WORKER:  "/api/worker",
  }[role] || "/api/student";
  const res = await api.put(`${base}/profile`, data);
  return res.data;
}

