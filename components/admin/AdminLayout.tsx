import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main-area">
        <AdminHeader />

        <main className="admin-content-area">{children}</main>
      </div>
    </div>
  );
}