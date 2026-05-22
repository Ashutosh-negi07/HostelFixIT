import api from "@/lib/api";

/** POST /api/auth/login */
export async function login({ email, password }) {
  const res = await api.post("/api/auth/login", { email, password });
  return res.data; // { token, userId, name, email, role }
}

/** POST /api/auth/logout */
export async function logout() {
  await api.post("/api/auth/logout");
}

/** GET /api/auth/me */
export async function getMe() {
  const res = await api.get("/api/auth/me");
  return res.data;
}
