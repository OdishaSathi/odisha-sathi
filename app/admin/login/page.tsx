"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

function getSafeNextPath() {
  if (typeof window === "undefined") return "/admin";

  const params = new URLSearchParams(window.location.search);
  const next = params.get("next") || "/admin";

  if (!next.startsWith("/admin")) return "/admin";
  if (next.startsWith("/admin/login")) return "/admin";

  return next;
}

function getLoginErrorMessage(error: any) {
  const code = String(error?.code || "");

  if (code.includes("auth/invalid-credential")) {
    return "Invalid email or password.";
  }

  if (code.includes("auth/user-not-found")) {
    return "Admin account not found.";
  }

  if (code.includes("auth/wrong-password")) {
    return "Wrong password.";
  }

  if (code.includes("auth/too-many-requests")) {
    return "Too many attempts. Please try again later.";
  }

  return "Login failed. Please check your email and password.";
}

export default function AdminLoginPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace(getSafeNextPath());
        return;
      }

      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setErrorMessage("Please enter admin email.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Please enter password.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      await signInWithEmailAndPassword(auth, email.trim(), password);

      router.replace(getSafeNextPath());
    } catch (error) {
      console.error(error);
      setErrorMessage(getLoginErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className="admin-login-page">
        <div className="admin-login-card">
          <h1>Checking login...</h1>
          <p>Please wait.</p>
        </div>

        <LoginStyles />
      </main>
    );
  }

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="admin-login-logo">
          <img src="/odisha-sathi-logo.png" alt="Odisha Sathi Logo" />
        </div>

        <h1>Admin Login</h1>
        <p>Login to manage Odisha Sathi posts and updates.</p>

        {errorMessage ? (
          <div className="admin-login-error">{errorMessage}</div>
        ) : null}

        <label>
          Email
          <input
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Logging in..." : "Login"}
        </button>

        <a href="/">← Back to website</a>
      </form>

      <LoginStyles />
    </main>
  );
}

function LoginStyles() {
  return (
    <style jsx global>{`
      .admin-login-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background:
          radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 34%),
          radial-gradient(circle at bottom right, rgba(232, 93, 4, 0.12), transparent 34%),
          #f5f7fb;
        padding: 20px;
        color: #0f172a;
      }

      .admin-login-card {
        width: min(420px, 100%);
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 22px;
        padding: 24px;
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
        display: grid;
        gap: 15px;
      }

      .admin-login-logo {
        display: flex;
        justify-content: center;
      }

      .admin-login-logo img {
        width: 78px;
        height: 78px;
        object-fit: contain;
      }

      .admin-login-card h1 {
        margin: 0;
        text-align: center;
        font-size: 28px;
        color: #0f172a;
      }

      .admin-login-card p {
        margin: 0;
        text-align: center;
        color: #64748b;
        line-height: 1.5;
      }

      .admin-login-error {
        background: #fef2f2;
        color: #991b1b;
        border: 1px solid #fecaca;
        border-radius: 12px;
        padding: 10px 12px;
        font-weight: 800;
        font-size: 14px;
      }

      .admin-login-card label {
        display: grid;
        gap: 7px;
        color: #334155;
        font-size: 14px;
        font-weight: 900;
      }

      .admin-login-card input {
        width: 100%;
        min-height: 44px;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        padding: 10px 12px;
        font-size: 15px;
        color: #0f172a;
        outline: none;
      }

      .admin-login-card input:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }

      .admin-login-card button {
        min-height: 46px;
        border: none;
        border-radius: 12px;
        background: #2563eb;
        color: #ffffff;
        font-size: 16px;
        font-weight: 950;
        cursor: pointer;
      }

      .admin-login-card button:hover {
        background: #e85d04;
      }

      .admin-login-card button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .admin-login-card a {
        text-align: center;
        color: #0b63ce;
        font-weight: 900;
        text-decoration: none;
      }

      .admin-login-card a:hover {
        color: #e85d04;
      }
    `}</style>
  );
}