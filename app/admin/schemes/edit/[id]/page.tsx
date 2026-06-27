import EditSchemeForm from "../../../../../components/forms/EditSchemeForm";
import * as AdminLayoutModule from "../../../../../components/admin/AdminLayout";

const AdminLayout: any =
  (AdminLayoutModule as any).default || (AdminLayoutModule as any).AdminLayout;

export default function EditSchemePage() {
  return (
    <AdminLayout>
      <div style={{ display: "grid", gap: "20px" }}>
        <div>
          <h1>Edit Scheme</h1>
          <p>Update scheme name, department, description and official links.</p>
        </div>

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        >
          <EditSchemeForm />
        </div>
      </div>
    </AdminLayout>
  );
}