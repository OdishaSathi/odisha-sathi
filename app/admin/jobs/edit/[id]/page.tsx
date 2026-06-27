"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import EditJobForm from "@/components/forms/EditJobForm";
import { useParams } from "next/navigation";

export default function EditJobPage() {
  const params = useParams();
  const id = String(params.id || "");

  return (
    <AdminLayout>
      <EditJobForm id={id} />
    </AdminLayout>
  );
}