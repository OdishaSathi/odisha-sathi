"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import EditJobForm from "@/components/forms/EditJobForm";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function EditJobPage() {
  const params = useParams();
  const id = String(params.id || "");

  return (
    <AdminLayout>
      <div style={{ display: "grid", gap: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: "0 0 4px", fontSize: "26px" }}>Edit Job</h1>
            <p style={{ margin: 0, color: "#64748b" }}>
              Open only the sections you need to update.
            </p>
          </div>

          <Link
            href="/admin/jobs"
            style={{
              padding: "8px 12px",
              border: "1px solid #cbd5e1",
              borderRadius: "9px",
              color: "#334155",
              background: "#ffffff",
              textDecoration: "none",
              fontWeight: 800,
            }}
          >
            ← Back to Jobs
          </Link>
        </div>

        <EditJobForm id={id} />
      </div>
    </AdminLayout>
  );
}
