import api from "@/lib/api";

/** GET /api/dashboard/stats */
export async function getDashboardStats() {
  const res = await api.get("/api/dashboard/stats");
  return res.data;
}
