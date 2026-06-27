"use client";

import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

type JobPost = {
  id: string;
  title?: string;
  slug?: string;
  organization?: string;
  status?: string;
  featured?: boolean;
  subCategories?: string[];
  createdAt?: any;
};

export default function JobPostList({ refreshKey }: { refreshKey: number }) {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);

      const q = query(collection(db, "posts"), where("category", "==", "jobs"));
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as JobPost[];

      data.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setJobs(data);
      setLoading(false);
    };

    loadJobs();
  }, [refreshKey]);

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this job post?");

    if (!confirmDelete) {
      return;
    }

    await deleteDoc(doc(db, "posts", id));

    setJobs((prev) => prev.filter((job) => job.id !== id));

    alert("Job post deleted successfully");
  };

  const filteredJobs = jobs.filter((job) => {
    const keyword = search.toLowerCase();

    return (
      job.title?.toLowerCase().includes(keyword) ||
      job.organization?.toLowerCase().includes(keyword) ||
      job.status?.toLowerCase().includes(keyword) ||
      job.subCategories?.join(" ").toLowerCase().includes(keyword)
    );
  });

  return (
    <section
      style={{
        background: "#ffffff",
        padding: "20px",
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
        marginTop: "30px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "15px",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
        <h2 style={{ margin: 0 }}>Saved Job Posts</h2>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jobs..."
          style={{
            width: "260px",
            maxWidth: "100%",
            padding: "10px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
          }}
        />
      </div>

      {loading && <p>Loading jobs...</p>}

      {!loading && filteredJobs.length === 0 && <p>No job posts found.</p>}

      {!loading &&
        filteredJobs.map((job) => (
          <div
            key={job.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "12px",
            }}
          >
            <h3 style={{ margin: "0 0 8px" }}>{job.title}</h3>

            {job.organization && (
              <p style={{ margin: "0 0 8px", color: "#475569" }}>
                Organization: {job.organization}
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  background:
                    job.status === "draft" ? "#f59e0b" : "#16a34a",
                  color: "#ffffff",
                  padding: "4px 8px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                {job.status || "published"}
              </span>

              {job.featured && (
                <span
                  style={{
                    background: "#2563eb",
                    color: "#ffffff",
                    padding: "4px 8px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  Featured
                </span>
              )}
            </div>

            {job.subCategories && job.subCategories.length > 0 && (
              <p style={{ margin: "0 0 10px", color: "#475569" }}>
                Categories: {job.subCategories.join(", ")}
              </p>
            )}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link
                href={`/admin/jobs/edit/${job.id}`}
                style={{
                  display: "inline-block",
                  background: "#2563eb",
                  color: "#ffffff",
                  textDecoration: "none",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                Edit
              </Link>

              {job.slug && (
                <Link
                  href={`/post/${job.slug}`}
                  target="_blank"
                  style={{
                    display: "inline-block",
                    background: "#0f172a",
                    color: "#ffffff",
                    textDecoration: "none",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                >
                  View Post
                </Link>
              )}

              <button
                type="button"
                onClick={() => handleDelete(job.id)}
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
    </section>
  );
}