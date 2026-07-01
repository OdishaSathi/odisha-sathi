"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

type ScholarshipPost = {
  id: string;
  title?: string;
  slug?: string;
  department?: string;
  scholarshipCategory?: string;
  eligibility?: string;
  applicationStartDate?: string;
  lastDate?: string;
  amountBenefit?: string;
  description?: string;
  status?: "active" | "closed";
  published?: boolean;
  createdAt?: {
    toMillis?: () => number;
  };
};

function formatDate(value?: string) {
  if (!value) return "Update soon";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<ScholarshipPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    async function fetchScholarships() {
      try {
        const q = query(
          collection(db, "posts"),
          where("category", "==", "scholarships")
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...(item.data() as Omit<ScholarshipPost, "id">),
          }))
          .filter((item) => item.published !== false)
          .sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });

        setScholarships(data);
      } catch (error) {
        console.error("Failed to fetch scholarships:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchScholarships();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        scholarships
          .map((item) => item.scholarshipCategory || "State Scholarships")
          .filter(Boolean)
      )
    );

    return ["All", ...uniqueCategories];
  }, [scholarships]);

  const filteredScholarships =
    selectedCategory === "All"
      ? scholarships
      : scholarships.filter(
          (item) =>
            (item.scholarshipCategory || "State Scholarships") ===
            selectedCategory
        );

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 px-4 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">
            Odisha Sathi
          </p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">
            Scholarships
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 md:text-base">
            Latest scholarship updates, application dates, eligibility,
            benefits and important links.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
            Loading scholarships...
          </div>
        ) : filteredScholarships.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
            No scholarship updates available right now.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredScholarships.map((post) => (
              <Link
                key={post.id}
                href={`/scholarships/${post.slug || post.id}`}
                className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {post.scholarshipCategory || "State Scholarships"}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      post.status === "closed"
                        ? "bg-red-50 text-red-700"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    {post.status === "closed" ? "Closed" : "Active"}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-700">
                  {post.title || "Untitled Scholarship"}
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  {post.department || "Department / Portal update"}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-500">
                      Start Date
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatDate(post.applicationStartDate)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-500">
                      Last Date
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatDate(post.lastDate)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-500">
                      Benefit
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {post.amountBenefit || "Update soon"}
                    </p>
                  </div>
                </div>

                {post.description ? (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                    {post.description}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}