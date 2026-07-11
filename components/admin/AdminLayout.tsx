"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

type AdminLayoutProps = {
  children: ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);

      if (!currentUser) {
        const nextPath = pathname || "/admin";
        router.replace(`/admin/login?next=${encodeURIComponent(nextPath)}`);
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await signOut(auth);
      router.replace("/admin/login");
    } catch (error) {
      console.error(error);
      alert("Failed to logout");
    } finally {
      setLoggingOut(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="admin-auth-loading">
        <div>
          <h2>Checking admin login...</h2>
          <p>Please wait.</p>
        </div>

        <style jsx>{`
          .admin-auth-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f7fb;
            color: #0f172a;
            text-align: center;
            padding: 20px;
          }

          .admin-auth-loading div {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 18px;
            padding: 24px;
            box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
          }

          .admin-auth-loading h2 {
            margin: 0 0 8px;
          }

          .admin-auth-loading p {
            margin: 0;
            color: #64748b;
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-auth-loading">
        <div>
          <h2>Redirecting to login...</h2>
          <p>Please wait.</p>
        </div>

        <style jsx>{`
          .admin-auth-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f7fb;
            color: #0f172a;
            text-align: center;
            padding: 20px;
          }

          .admin-auth-loading div {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 18px;
            padding: 24px;
            box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
          }

          .admin-auth-loading h2 {
            margin: 0 0 8px;
          }

          .admin-auth-loading p {
            margin: 0;
            color: #64748b;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-layout-shell">
      <AdminSidebar />

      <div className="admin-layout-main">
        <AdminHeader />

        <div className="admin-auth-bar">
          <div>
            <strong>Admin Panel</strong>
            <span>{user.email || "Logged in"}</span>
          </div>

          <button type="button" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>

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

        .admin-auth-bar {
          margin: 18px 24px 0;
          padding: 12px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
        }

        .admin-auth-bar div {
          display: grid;
          gap: 2px;
        }

        .admin-auth-bar strong {
          font-size: 14px;
          color: #0f172a;
        }

        .admin-auth-bar span {
          font-size: 13px;
          color: #64748b;
          word-break: break-all;
        }

        .admin-auth-bar button {
          border: none;
          border-radius: 999px;
          background: #dc2626;
          color: #ffffff;
          padding: 9px 14px;
          font-weight: 900;
          cursor: pointer;
          white-space: nowrap;
        }

        .admin-auth-bar button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
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

          .admin-auth-bar {
            margin: 14px 12px 0;
            align-items: flex-start;
            flex-direction: column;
          }

          .admin-auth-bar button {
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