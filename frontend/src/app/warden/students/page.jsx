"use client";
import { useState } from "react";
import UserManagementTable from "@/components/shared/UserManagementTable";

export default function WardenStudents() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students 🎓</h1>
          <p className="page-subtitle">Manage students in your hostel.</p>
        </div>
      </div>
      <UserManagementTable actorRole="WARDEN" targetRole="STUDENT" canCreate />
    </div>
  );
}
