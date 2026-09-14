"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
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

const cardStyle: CSSProperties = {
  background: "white",
  padding: "20px",
  borderRadius: "14px",
  border: "1px solid #e5e7eb",
};

const actionButtonStyle: CSSProperties = {
  padding: "8px 14px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  background: "#ffffff",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "14px",
};

const savedItemStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
};

const savedTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "16px",
  lineHeight: 1.4,
  fontWeight: 700,
  color: "#111827",
};

const savedMetaStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: "14px",
  color: "#6b7280",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  alignItems: "center",
};

const viewButtonStyle: CSSProperties = {
  borderRadius: "8px",
  background: "#ecfdf5",
  padding: "8px 14px",
  fontSize: "14px",
  fontWeight: 700,
  color: "#16a34a",
  textDecoration: "none",
};

const editButtonStyle: CSSProperties = {
  borderRadius: "8px",
  background: "#f3f4f6",
  padding: "8px 14px",
  fontSize: "14px",
  fontWeight: 700,
  color: "#374151",
  textDecoration: "none",
};

const deleteButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: "8px",
  background: "#fef2f2",
  padding: "8px 14px",
  fontSize: "14px",
  fontWeight: 700,
  color: "#dc2626",
  cursor: "pointer",
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredJobs = useMemo(() => {
    const queryText = searchQuery.trim().toLowerCase();
    if (!queryText) return jobs;

    return jobs.filter((job) => {
      const categories = [
        job.subCategory,
        ...(job.subCategories || []),
      ].join(" ");

      return `${job.title} ${job.slug || ""} ${categories}`
        .toLowerCase()
        .includes(queryText);
    });
  }, [jobs, searchQuery]);

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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search saved jobs"
                aria-label="Search saved jobs"
                style={{
                  width: "min(260px, 100%)",
                  minHeight: "38px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "9px",
                  padding: "8px 10px",
                  color: "#0f172a",
                  background: "#ffffff",
                }}
              />

              <button type="button" onClick={loadJobs} style={actionButtonStyle}>
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <p>Loading jobs...</p>
          ) : filteredJobs.length === 0 ? (
            <p>{searchQuery.trim() ? "No matching jobs found." : "No jobs found."}</p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {filteredJobs.map((job) => {
                const selectedSubCategories =
                  job.subCategories && job.subCategories.length > 0
                    ? job.subCategories
                    : job.subCategory
                    ? [job.subCategory]
                    : [];
                const subCategoryText =
                  selectedSubCategories.length > 0
                    ? selectedSubCategories.join(" | ")
                    : "Subcategory not selected";

                return (
                  <div key={job.id} style={savedItemStyle}>
                    <div style={{ minWidth: 0, flex: "1 1 360px" }}>
                      <h3 style={savedTitleStyle}>{job.title}</h3>

                      <p style={savedMetaStyle}>{subCategoryText}</p>
                    </div>

                    <div style={actionRowStyle}>
                      <Link
                        href={`/post/${job.slug || job.id}`}
                        target="_blank"
                        style={viewButtonStyle}
                      >
                        View
                      </Link>

                      <Link
                        href={`/admin/jobs/edit/${job.id}`}
                        style={editButtonStyle}
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        disabled={deletingId === job.id}
                        onClick={() => handleDelete(job.id, job.title)}
                        style={{
                          ...deleteButtonStyle,
                          cursor:
                            deletingId === job.id ? "not-allowed" : "pointer",
                        }}
                      >
                        {deletingId === job.id ? "..." : "Delete"}
                      </button>

                      <AdminPostShareButtons
                        title={job.title || "Odisha Sathi Job Update"}
                        publicPath={`/post/${job.slug || job.id}`}
                      />
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
