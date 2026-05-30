import { create } from "zustand";
import { getUser, clearAuth } from "@/lib/auth";

const useAuthStore = create((set) => ({
  user: null,

  /** Call this on app mount to hydrate from localStorage */
  init: () => {
    const user = getUser();
    set({ user });
  },

  /** Call after successful login */
  setUser: (user) => set({ user }),

  /** Call on logout */
  logout: () => {
    clearAuth();
    set({ user: null });
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },
}));

export default useAuthStore;
