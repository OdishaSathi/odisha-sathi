"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { jobSubCategories } from "@/lib/categories";

type JobPost = {
  id: string;
  title?: string;
  slug?: string;
  organization?: string;
  qualification?: string;
  lastDate?: string;
  status?: string;
  featured?: boolean;
  subCategories?: string[];
  createdAt?: any;
};

export default function JobsHomeContent() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);

      const snapshot = await getDocs(collection(db, "posts"));

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as JobPost[];

      const publishedPosts = data.filter((post) => {
        return post.status !== "draft";
      });

      publishedPosts.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setJobs(publishedPosts);
      setLoading(false);
    };

    loadJobs();
  }, []);

  return (
    <main style={{ maxWidth: "1100px", margin: "30px auto", padding: "20px" }}>
      <section style={{ marginBottom: "35px" }}>
        <p style={{ color: "#2563eb", fontWeight: "bold", marginBottom: "6px" }}>
          Odisha Sathi Jobs
        </p>

        <h1 style={{ fontSize: "34px", margin: "0 0 10px" }}>
          Latest Odisha & Central Job Updates
        </h1>

        <p style={{ color: "#64748b", margin: 0 }}>
          Browse latest government, private, Odisha, central, railway, banking,
          teaching and other job updates.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Job Categories</h2>

        <div style={categoryGridStyle}>
          {jobSubCategories.map((item) => (
            <Link
              key={item}
              href={`/jobs/${encodeURIComponent(item)}`}
              style={{
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "14px",
                textDecoration: "none",
                color: "#0f172a",
                fontWeight: "bold",
              }}
            >
              {item}
            </Link>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Latest Job Posts</h2>

        {loading && <p>Loading latest jobs...</p>}

        {!loading && jobs.length === 0 && (
          <p>No latest job posts found. Create a new published job from admin.</p>
        )}

        {!loading &&
          jobs.map((job) => (
            <article
              key={job.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "18px",
                marginBottom: "15px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginBottom: "10px",
                }}
              >
                {job.featured && <span style={featuredBadgeStyle}>Featured</span>}

                <span style={publishedBadgeStyle}>
                  {job.status || "published"}
                </span>
              </div>

              <h3 style={{ margin: "0 0 12px", fontSize: "23px" }}>
                {job.slug ? (
                  <Link
                    href={`/post/${job.slug}`}
                    style={{ color: "#0f172a", textDecoration: "none" }}
                  >
                    {job.title}
                  </Link>
                ) : (
                  job.title
                )}
              </h3>

              <div style={jobInfoGridStyle}>
                {job.organization && (
                  <InfoItem label="Organization" value={job.organization} />
                )}

                {job.qualification && (
                  <InfoItem label="Qualification" value={job.qualification} />
                )}

                {job.lastDate && (
                  <InfoItem label="Last Date" value={job.lastDate} />
                )}
              </div>

              {job.subCategories && job.subCategories.length > 0 && (
                <p style={{ color: "#475569", marginTop: "12px" }}>
                  Categories: {job.subCategories.join(", ")}
                </p>
              )}

              {job.slug && (
                <Link href={`/post/${job.slug}`} style={buttonStyle}>
                  View Details
                </Link>
              )}
            </article>
          ))}
      </section>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value?: string }) {
  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "10px",
      }}
    >
      <p style={{ margin: "0 0 4px", color: "#64748b", fontSize: "13px" }}>
        {label}
      </p>

      <p style={{ margin: 0, color: "#0f172a", fontWeight: "bold" }}>
        {value}
      </p>
    </div>
  );
}

const sectionStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "22px",
  marginBottom: "25px",
};

const sectionTitleStyle = {
  fontSize: "24px",
  marginTop: 0,
  marginBottom: "18px",
};

const categoryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
};

const jobInfoGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "12px",
};

const featuredBadgeStyle = {
  background: "#2563eb",
  color: "#ffffff",
  padding: "4px 8px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "bold",
};

const publishedBadgeStyle = {
  background: "#dcfce7",
  color: "#166534",
  padding: "4px 8px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "bold",
};

const buttonStyle = {
  display: "inline-block",
  background: "#0f172a",
  color: "#ffffff",
  textDecoration: "none",
  padding: "10px 14px",
  borderRadius: "8px",
  fontWeight: "bold",
  marginTop: "12px",
};