"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

const ROLE_ROUTES = {
  ADMIN:       "/admin",
  SUPER_ADMIN: "/superadmin",
  WARDEN:      "/warden",
  STUDENT:     "/student",
  WORKER:      "/worker",
};

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/login");
    } else {
      const dest = ROLE_ROUTES[user.role] || "/login";
      router.replace(dest);
    }
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
      }}
    >
      <LoadingSpinner size="lg" />
    </div>
  );
}
