import api from "@/lib/api";

/** GET /api/student/categories */
export async function getCategories() {
  const res = await api.get("/api/student/categories");
  return res.data; // List<CategoryResponse>
}

/** GET /api/admin/categories */
export async function adminGetCategories() {
  const res = await api.get("/api/admin/categories");
  return res.data;
}

/** POST /api/admin/categories */
export async function createCategory({ name, description }) {
  const res = await api.post("/api/admin/categories", { name, description });
  return res.data;
}

/** PUT /api/admin/categories/{id} */
export async function updateCategory(id, { name, description }) {
  const res = await api.put(`/api/admin/categories/${id}`, { name, description });
  return res.data;
}

/** DELETE /api/admin/categories/{id} */
export async function deleteCategory(id) {
  const res = await api.delete(`/api/admin/categories/${id}`);
  return res.data;
}
