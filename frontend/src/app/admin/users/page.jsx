"use client";
import { useState } from "react";
import UserManagementTable from "@/components/shared/UserManagementTable";

const ROLES = [
  { label: "All Users",  value: null },
  { label: "Students",   value: "STUDENT" },
  { label: "Wardens",    value: "WARDEN" },
  { label: "Workers",    value: "WORKER" },
  { label: "Admins",     value: "ADMIN" },
];

export default function AdminUsers() {
  const [selectedRole, setSelectedRole] = useState(null);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">User Management 👥</h1><p className="page-subtitle">Manage all users in the system.</p></div>
      </div>

      <div className="tabs" style={{ marginBottom: "1.5rem" }}>
        {ROLES.map((r) => (
          <button key={String(r.value)} className={`tab${selectedRole === r.value ? " active" : ""}`} onClick={() => setSelectedRole(r.value)}>{r.label}</button>
        ))}
      </div>

      <UserManagementTable actorRole="ADMIN" targetRole={selectedRole} canCreate={!!selectedRole} />
    </div>
  );
}
