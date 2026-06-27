"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import * as AdminLayoutModule from "../../components/admin/AdminLayout";

const AdminLayout: any =
  (AdminLayoutModule as any).default || (AdminLayoutModule as any).AdminLayout;

type AdminPost = {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  content?: string;
  schemeName?: string;
  department?: string;
  createdAt?: any;
};

function getCategoryLabel(category?: string) {
  if (category === "jobs") return "Job";
  if (category === "results") return "Result";
  if (category === "admissions") return "Admission";
  if (category === "admit-cards") return "Admit Card";
  if (category === "schemes") return "Scheme";
  return "Post";
}

function getPublicLink(post: AdminPost) {
  if (post.category === "schemes") {
    return `/schemes/${post.id}`;
  }

  return `/post/${post.slug || post.id}`;
}

function getAdminEditLink(post: AdminPost) {
  if (post.category === "jobs") return `/admin/jobs/edit/${post.id}`;
  if (post.category === "results") return `/admin/results/edit/${post.id}`;
  if (post.category === "admissions") return `/admin/admissions/edit/${post.id}`;
  if (post.category === "admit-cards") return `/admin/admit-cards/edit/${post.id}`;
  if (post.category === "schemes") return `/admin/schemes/edit/${post.id}`;

  return "/admin";
}

function CountCard({
  title,
  count,
  href,
}: {
  title: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        background: "white",
        padding: "18px",
        borderRadius: "14px",
        border: "1px solid #e5e7eb",
        textDecoration: "none",
        color: "inherit",
        display: "block",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#6b7280",
          fontSize: "14px",
          fontWeight: "600",
        }}
      >
        {title}
      </p>

      <h2
        style={{
          margin: "8px 0 0",
          fontSize: "34px",
          color: "#111827",
        }}
      >
        {count}
      </h2>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);

  const jobsCount = posts.filter((item) => item.category === "jobs").length;
  const resultsCount = posts.filter((item) => item.category === "results").length;
  const admissionsCount = posts.filter(
    (item) => item.category === "admissions"
  ).length;
  const admitCardsCount = posts.filter(
    (item) => item.category === "admit-cards"
  ).length;
  const schemesCount = posts.filter((item) => item.category === "schemes").length;

  const latestPosts = posts.slice(0, 8);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(collection(db, "posts"));

      const postList: AdminPost[] = snapshot.docs
        .map((docItem) => {
          const data = docItem.data();

          return {
            id: docItem.id,
            title: data.title || "",
            slug: data.slug || "",
            category: data.category || "",
            content: data.content || data.description || "",
            schemeName: data.schemeName || data.title || "",
            department: data.department || "",
            createdAt: data.createdAt || null,
          };
        })
        .filter((item) =>
          ["jobs", "results", "admissions", "admit-cards", "schemes"].includes(
            item.category || ""
          )
        )
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

      setPosts(postList);
    } catch (error) {
      console.error(error);
      alert("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <AdminLayout>
      <div style={{ display: "grid", gap: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ marginBottom: "6px" }}>Admin Dashboard</h1>
            <p style={{ margin: 0, color: "#4b5563" }}>
              Overview of Odisha Sathi website content.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            style={{
              padding: "9px 13px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              background: "white",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "14px",
              border: "1px solid #e5e7eb",
            }}
          >
            <p style={{ margin: 0 }}>Loading dashboard...</p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: "14px",
              }}
            >
              <CountCard title="Jobs" count={jobsCount} href="/admin/jobs" />
              <CountCard
                title="Results"
                count={resultsCount}
                href="/admin/results"
              />
              <CountCard
                title="Admissions"
                count={admissionsCount}
                href="/admin/admissions"
              />
              <CountCard
                title="Admit Cards"
                count={admitCardsCount}
                href="/admin/admit-cards"
              />
              <CountCard
                title="Schemes"
                count={schemesCount}
                href="/admin/schemes"
              />
            </div>

            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "14px",
                border: "1px solid #e5e7eb",
              }}
            >
              <h2 style={{ marginTop: 0 }}>Latest Posts</h2>

              {latestPosts.length === 0 ? (
                <p>No posts found.</p>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {latestPosts.map((post) => {
                    const displayTitle =
                      post.category === "schemes"
                        ? post.schemeName || post.title || "Untitled Scheme"
                        : post.title || "Untitled Post";

                    return (
                      <div
                        key={post.id}
                        style={{
                          padding: "14px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          display: "grid",
                          gap: "10px",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 8px",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              borderRadius: "999px",
                              fontSize: "12px",
                              fontWeight: "700",
                              marginBottom: "8px",
                            }}
                          >
                            {getCategoryLabel(post.category)}
                          </span>

                          <h3 style={{ margin: 0 }}>{displayTitle}</h3>

                          {post.category === "schemes" ? (
                            <p
                              style={{
                                margin: "6px 0 0",
                                color: "#4b5563",
                                fontSize: "14px",
                              }}
                            >
                              {post.department || "Department not added"}
                            </p>
                          ) : null}
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "74px 74px",
                            gap: "10px",
                            width: "fit-content",
                          }}
                        >
                          <Link
                            href={getPublicLink(post)}
                            target="_blank"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "74px",
                              height: "36px",
                              background: "#16a34a",
                              color: "white",
                              borderRadius: "8px",
                              textDecoration: "none",
                              fontSize: "14px",
                            }}
                          >
                            View
                          </Link>

                          <Link
                            href={getAdminEditLink(post)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "74px",
                              height: "36px",
                              background: "#2563eb",
                              color: "white",
                              borderRadius: "8px",
                              textDecoration: "none",
                              fontSize: "14px",
                            }}
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}