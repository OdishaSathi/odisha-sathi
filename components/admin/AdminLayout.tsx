"use client";

import { ReactNode } from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

type AdminLayoutProps = {
  children: ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="admin-layout-shell">
      <AdminSidebar />

      <div className="admin-layout-main">
        <AdminHeader />

        <main className="admin-layout-content">
          <div className="admin-layout-inner">{children}</div>
        </main>
      </div>

      <style jsx>{`
        .admin-layout-shell {
          min-height: 100vh;
          width: 100%;
          display: flex;
          background: #f5f7fb;
          color: #0f172a;
          overflow-x: hidden;
        }

        .admin-layout-main {
          flex: 1;
          min-width: 0;
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        .admin-layout-content {
          width: 100%;
          flex: 1;
          padding: 28px 24px 40px;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .admin-layout-inner {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .admin-layout-shell {
            display: block;
          }

          .admin-layout-main {
            width: 100%;
          }

          .admin-layout-content {
            padding: 16px 12px 32px;
          }
        }
      `}</style>
    </div>
  );
}

export default AdminLayout;