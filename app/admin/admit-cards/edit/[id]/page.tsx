import EditAdmitCardForm from "@/components/forms/EditAdmitCardForm";
import AdminLayout from "@/components/admin/AdminLayout";

export default function EditAdmitCardPage() {
  return (
    <AdminLayout>
      <div style={{ display: "grid", gap: "20px" }}>
        <div>
          <h1>Edit Admit Card</h1>
          <p>Update admit card title, details and subcategories.</p>
        </div>

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        >
          <EditAdmitCardForm />
        </div>
      </div>
    </AdminLayout>
  );
}