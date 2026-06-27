"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

const JOB_SUB_CATEGORIES = [
  "Odisha Jobs",
  "Central Jobs",
  "Apprenticeship",
  "10th Jobs",
  "ITI Jobs",
  "Diploma Jobs",
  "+2 Jobs",
  "+3 Jobs",
  "Technical Graduate Jobs",
  "Post Graduate Jobs",
];

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

export default function JobsPage() {
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
          .filter((item) => item.category === "jobs")
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          })
          .slice(0, 10);

        setJobs(jobList);
      } catch (error) {
        console.error(error);
        alert("Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  return (
    <main className="category-page-main">
      <section className="category-hero-card">
        <h1>Latest Jobs</h1>
        <p>
          Find Odisha jobs, central jobs, apprenticeship, 10th jobs, ITI jobs,
          diploma jobs and graduate jobs.
        </p>
      </section>

      <section className="category-box">
        <h2>Job Categories</h2>

        <div className="job-category-grid">
          {JOB_SUB_CATEGORIES.map((item) => (
            <Link
              key={item}
              href={`/jobs/${encodeURIComponent(item)}`}
              className="job-category-link"
            >
              {item}
            </Link>
          ))}
        </div>
      </section>

      <section className="category-box">
        <h2>Recently Added Jobs</h2>

        {loading ? (
          <p className="category-status-text">Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <p className="category-status-text">No jobs found.</p>
        ) : (
          <div className="category-post-list">
            {jobs.map((job) => (
              <article key={job.id} className="category-post-card">
                <h3>{job.title}</h3>

                {job.subCategories && job.subCategories.length > 0 ? (
                  <div className="category-tag-row">
                    {job.subCategories.map((item) => (
                      <span key={item} className="category-tag">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}

                {job.content ? (
                  <p>
                    {job.content.length > 150
                      ? `${job.content.slice(0, 150)}...`
                      : job.content}
                  </p>
                ) : null}

                <Link
                  href={`/post/${job.slug || job.id}`}
                  className="category-details-btn"
                >
                  View Details
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}