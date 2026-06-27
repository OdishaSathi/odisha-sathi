"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";

type JobPost = {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  category?: string;
  subCategory?: string;
  subCategories?: string[];
  createdAt?: any;
};

export default function JobSubCategoryPage() {
  const params = useParams();

  const rawSubCategory =
    typeof params.subCategory === "string"
      ? params.subCategory
      : Array.isArray(params.subCategory)
      ? params.subCategory[0]
      : "";

  const subCategoryName = decodeURIComponent(rawSubCategory);

  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
              content: data.content || "",
              category: data.category || "",
              subCategory: data.subCategory || "",
              subCategories: Array.isArray(data.subCategories)
                ? data.subCategories
                : data.subCategory
                ? [data.subCategory]
                : [],
              createdAt: data.createdAt || null,
            };
          })
          .filter((item) => {
            return (
              item.category === "jobs" &&
              Array.isArray(item.subCategories) &&
              item.subCategories.includes(subCategoryName)
            );
          })
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

    loadJobs();
  }, [subCategoryName]);

  return (
    <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <Link href="/jobs" style={{ color: "#2563eb", textDecoration: "none" }}>
          ← Back to Jobs
        </Link>

        <h1 style={{ marginTop: "16px" }}>{subCategoryName}</h1>
        <p>Latest jobs listed under {subCategoryName}.</p>
      </div>

      {loading ? (
        <p>Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <div
          style={{
            background: "white",
            padding: "20px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
          }}
        >
          <p>No jobs found in this subcategory.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          {jobs.map((job) => (
            <div
              key={job.id}
              style={{
                background: "white",
                padding: "18px",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>{job.title}</h2>

              {job.content ? (
                <p style={{ color: "#4b5563" }}>
                  {job.content.length > 160
                    ? `${job.content.slice(0, 160)}...`
                    : job.content}
                </p>
              ) : null}

              <Link
                href={`/post/${job.slug || job.id}`}
                style={{
                  display: "inline-block",
                  marginTop: "10px",
                  padding: "9px 12px",
                  background: "#2563eb",
                  color: "white",
                  borderRadius: "8px",
                  textDecoration: "none",
                }}
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}