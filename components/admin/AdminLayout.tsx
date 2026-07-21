"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

export function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
      if (!currentUser) {
        router.replace(`/admin/login?next=${encodeURIComponent(pathname || "/admin")}`);
      }
    });
    return () => unsubscribe();
  }, [pathname, router]);

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await signOut(auth);
      router.replace("/admin/login");
    } catch (error) {
      console.error(error);
      window.alert("Failed to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  if (checkingAuth || !user) {
    return (
      <div className="admin-auth-loading" role="status">
        <div><span className="admin-spinner" /><h2>{checkingAuth ? "Checking admin login…" : "Redirecting to login…"}</h2><p>Please wait.</p></div>
      </div>
    );
  }

  return (
    <div className="admin-layout-shell">
      <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="admin-layout-main">
        <AdminHeader
          email={user.email}
          loggingOut={loggingOut}
          onMenu={() => setMenuOpen(true)}
          onLogout={handleLogout}
        />
        <main className="admin-layout-content"><div className="admin-layout-inner">{children}</div></main>
      </div>
      <style jsx global>{`
        .admin-layout-shell{min-height:100vh;display:flex;background:#f4f7fb;color:#0f172a;overflow-x:hidden}
        .admin-layout-main{flex:1;min-width:0;margin-left:260px}
        .admin-layout-content{padding:24px;box-sizing:border-box}
        .admin-layout-inner{width:100%;max-width:1440px;margin:0 auto;min-width:0}
        .admin-sidebar{position:fixed;inset:0 auto 0 0;z-index:50;width:260px;background:#0f2747;color:#fff;display:flex;flex-direction:column;box-shadow:8px 0 30px rgba(15,39,71,.08)}
        .admin-sidebar-brand{height:76px;padding:0 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.1)}
        .admin-sidebar-brand h2{font-size:19px;margin:0;color:#fff}.admin-sidebar-brand p{font-size:12px;margin:3px 0 0;color:#b9cae1}
        .admin-sidebar-close{display:none;border:0;background:transparent;color:#fff;padding:8px}
        .admin-sidebar-nav{display:block;padding:16px 12px 24px;overflow-y:auto;overscroll-behavior:contain}
        .admin-sidebar-group{margin-bottom:18px}.admin-sidebar-group-label{margin:0 10px 7px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#8fa9c9}
        .admin-sidebar-link{min-height:44px;padding:9px 11px;display:flex;align-items:center;gap:11px;border-radius:9px;color:#d9e5f3;text-decoration:none;font-size:14px;font-weight:650}
        .admin-sidebar-link:hover{background:rgba(255,255,255,.08);color:#fff}.admin-sidebar-link-active{background:#fff!important;color:#12355f!important;box-shadow:0 8px 20px rgba(0,0,0,.12)}
        .admin-sidebar-backdrop{display:none}
        .admin-header{position:sticky;top:0;z-index:35;min-height:76px;padding:12px 24px;display:flex;align-items:center;gap:14px;background:rgba(255,255,255,.96);border-bottom:1px solid #e2e8f0;backdrop-filter:blur(12px)}
        .admin-menu-button{display:none}.admin-header-text{min-width:0;flex:1}.admin-header-text h1{font-size:21px;line-height:1.2;margin:0;color:#102a4c}.admin-header-text p{font-size:12px;margin:4px 0 0;color:#64748b;overflow:hidden;text-overflow:ellipsis}
        .admin-header-actions{display:flex;gap:8px}.admin-header-actions a,.admin-header-actions button{min-height:42px;padding:0 13px;border:1px solid #d7e0ea;border-radius:9px;background:#fff;color:#17365f;display:inline-flex;align-items:center;gap:7px;text-decoration:none;font-weight:750;cursor:pointer}.admin-header-actions button{color:#b42318}.admin-header-actions button:disabled{opacity:.6}
        .admin-auth-loading{min-height:100vh;display:grid;place-items:center;background:#f4f7fb;padding:20px;text-align:center}.admin-auth-loading>div{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;box-shadow:0 16px 40px rgba(15,39,71,.08)}.admin-auth-loading h2{font-size:18px;margin:14px 0 5px}.admin-auth-loading p{margin:0;color:#64748b}.admin-spinner{display:inline-block;width:30px;height:30px;border:3px solid #dbeafe;border-top-color:#2563eb;border-radius:50%;animation:admin-spin .8s linear infinite}@keyframes admin-spin{to{transform:rotate(360deg)}}
        @media(max-width:900px){
          .admin-layout-main{margin-left:0}.admin-layout-content{padding:16px 12px 88px}.admin-header{min-height:64px;padding:8px 12px}.admin-menu-button{width:44px;height:44px;flex:0 0 44px;border:1px solid #d7e0ea;border-radius:9px;background:#fff;color:#17365f;display:grid;place-items:center}.admin-header-text h1{font-size:17px}.admin-header-text p{max-width:38vw}.admin-header-actions a,.admin-header-actions button{width:44px;height:44px;padding:0;justify-content:center}.admin-header-actions span{display:none}
          .admin-sidebar{transform:translateX(-105%);transition:transform .22s ease;width:min(86vw,320px);padding:0;min-height:100vh;position:fixed}.admin-sidebar.is-open{transform:translateX(0)}.admin-sidebar-close{display:grid;place-items:center}.admin-sidebar-backdrop{position:fixed;inset:0;z-index:45;border:0;background:rgba(15,23,42,.55);opacity:0;pointer-events:none;display:block;transition:opacity .2s}.admin-sidebar-backdrop.is-open{opacity:1;pointer-events:auto}
          .admin-sidebar-brand{height:76px;padding:0 20px;margin:0}.admin-sidebar-brand h2{font-size:19px}.admin-sidebar-brand p{font-size:12px;margin-top:3px}
          .admin-sidebar-nav{display:block!important;padding:16px 12px 28px!important;overflow-y:auto!important}.admin-sidebar-group{display:block;margin-bottom:18px}.admin-sidebar-group-label{display:block;margin:0 10px 7px}.admin-sidebar-link{width:auto;min-width:0;min-height:44px;padding:9px 11px;font-size:14px;line-height:1.35;border-radius:9px;text-align:left;white-space:normal;background:transparent;display:flex;align-items:center;gap:11px}.admin-sidebar-link-active{background:#fff!important;color:#12355f!important}
        }
        @media(max-width:420px){.admin-header-text p{display:none}.admin-header-actions{gap:5px}}
      `}</style>
    </div>
  );
}

export default AdminLayout;
