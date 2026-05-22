"use client";
import UserManagementTable from "@/components/shared/UserManagementTable";

export default function WardenWorkers() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Workers 👷</h1>
          <p className="page-subtitle">Manage maintenance workers in your hostel.</p>
        </div>
      </div>
      <UserManagementTable actorRole="WARDEN" targetRole="WORKER" canCreate />
    </div>
  );
}
