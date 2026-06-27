import EditAdmissionForm from "../../../../../components/forms/EditAdmissionForm";
import * as AdminLayoutModule from "../../../../../components/admin/AdminLayout";

const AdminLayout: any =
  (AdminLayoutModule as any).default || (AdminLayoutModule as any).AdminLayout;

export default function EditAdmissionPage() {
  return (
    <AdminLayout>
      <div style={{ display: "grid", gap: "20px" }}>
        <div>
          <h1>Edit Admission</h1>
          <p>Update admission title, details and subcategories.</p>
        </div>

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        >
          <EditAdmissionForm />
        </div>
      </div>
    </AdminLayout>
  );
}