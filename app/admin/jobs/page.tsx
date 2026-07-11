"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import JobForm from "../../../components/forms/JobForm";
import * as AdminLayoutModule from "../../../components/admin/AdminLayout";
import AdminPostShareButtons from "@/components/admin/AdminPostShareButtons";

const AdminLayout: any =
  (AdminLayoutModule as any).default || (AdminLayoutModule as any).AdminLayout;

type JobPost = {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  subCategory?: string;
  subCategories?: string[];
  createdAt?: any;
};

const cardStyle = {
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
};

const actionButtonStyle = {
  padding: "9px 13px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  background: "white",
  cursor: "pointer",
  fontWeight: 700,
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadJobs = async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(collection(db, "posts"));

      const jobList: JobPost[] = snapshot.docs
        .map((docItem) => {
          const data = docItem.data();

          return {
            id: docItem.id,
            title: data.title || "",
            slug: data.slug || "",
            category: data.category || "",
            subCategory: data.subCategory || "",
            subCategories: Array.isArray(data.subCategories)
              ? data.subCategories
              : [],
            createdAt: data.createdAt || null,
          };
        })
        .filter((item) => item.category === "jobs")
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

      setJobs(jobList);
    } catch (error) {
      console.error(error);
      alert("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string, jobTitle: string) => {
    const confirmDelete = window.confirm(`Delete this job?\n\n${jobTitle}`);

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(jobId);

      await deleteDoc(doc(db, "posts", jobId));

      alert("Job deleted successfully");

      await loadJobs();
    } catch (error) {
      console.error(error);
      alert("Failed to delete job");
    } finally {
      setDeletingId("");
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <AdminLayout>
      <div style={{ display: "grid", gap: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: "0 0 6px" }}>Jobs</h1>
            <p style={{ margin: 0, color: "#64748b" }}>
              Saved jobs first. Use Create New Job only when you need to add a post.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateForm((oldValue) => !oldValue)}
            style={{
              ...actionButtonStyle,
              background: showCreateForm ? "#f3f4f6" : "#2563eb",
              color: showCreateForm ? "#111827" : "white",
              borderColor: showCreateForm ? "#d1d5db" : "#2563eb",
            }}
          >
            {showCreateForm ? "Hide Form" : "+ Create New Job"}
          </button>
        </div>

        {showCreateForm ? (
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Create New Job</h2>
            <JobForm
              onSaved={() => {
                setShowCreateForm(false);
                loadJobs();
              }}
            />
          </div>
        ) : null}

        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>Saved Jobs</h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
                {jobs.length} posts saved
              </p>
            </div>

            <button type="button" onClick={loadJobs} style={actionButtonStyle}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p>Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <p>No jobs found.</p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {jobs.map((job) => {
                const selectedSubCategories =
                  job.subCategories && job.subCategories.length > 0
                    ? job.subCategories
                    : job.subCategory
                    ? [job.subCategory]
                    : [];

                return (
                  <div
                    key={job.id}
                    style={{
                      padding: "14px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      display: "grid",
                      gap: "12px",
                    }}
                  >
                    <h3 style={{ margin: 0 }}>{job.title}</h3>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "74px 74px 74px auto",
                        gap: "10px",
                        alignItems: "center",
                        width: "fit-content",
                      }}
                    >
                      <Link
                        href={`/post/${job.slug || job.id}`}
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
                        href={`/admin/jobs/edit/${job.id}`}
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

                      <button
                        type="button"
                        disabled={deletingId === job.id}
                        onClick={() => handleDelete(job.id, job.title)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "74px",
                          height: "36px",
                          background: "#dc2626",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        {deletingId === job.id ? "..." : "Delete"}
                      </button>

                      <AdminPostShareButtons
                        title={job.title || "Odisha Sathi Job Update"}
                        publicPath={`/post/${job.slug || job.id}`}
                      />
                    </div>

                    <div>
                      <strong>Subcategories:</strong>

                      {selectedSubCategories.length === 0 ? (
                        <span> Not selected</span>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                            marginTop: "8px",
                          }}
                        >
                          {selectedSubCategories.map((item) => (
                            <span
                              key={item}
                              style={{
                                padding: "5px 9px",
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                borderRadius: "999px",
                                fontSize: "13px",
                                border: "1px solid #bfdbfe",
                              }}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
