"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";

type ResultPost = {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  category?: string;
  subCategory?: string;
  subCategories?: string[];
  createdAt?: any;
};

export default function ResultSubCategoryPage() {
  const params = useParams();

  const rawSubCategory =
    typeof params.subCategory === "string"
      ? params.subCategory
      : Array.isArray(params.subCategory)
      ? params.subCategory[0]
      : "";

  const subCategoryName = decodeURIComponent(rawSubCategory);

  const [results, setResults] = useState<ResultPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);

        const snapshot = await getDocs(collection(db, "posts"));

        const resultList: ResultPost[] = snapshot.docs
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
              item.category === "results" &&
              Array.isArray(item.subCategories) &&
              item.subCategories.includes(subCategoryName)
            );
          })
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          });

        setResults(resultList);
      } catch (error) {
        console.error(error);
        alert("Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [subCategoryName]);

  return (
    <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <Link
          href="/results"
          style={{ color: "#2563eb", textDecoration: "none" }}
        >
          ← Back to Results
        </Link>

        <h1 style={{ marginTop: "16px" }}>{subCategoryName}</h1>
        <p>Latest results listed under {subCategoryName}.</p>
      </div>

      {loading ? (
        <p>Loading results...</p>
      ) : results.length === 0 ? (
        <div
          style={{
            background: "white",
            padding: "20px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
          }}
        >
          <p>No results found in this subcategory.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          {results.map((result) => (
            <div
              key={result.id}
              style={{
                background: "white",
                padding: "18px",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>{result.title}</h2>

              {result.content ? (
                <p style={{ color: "#4b5563" }}>
                  {result.content.length > 160
                    ? `${result.content.slice(0, 160)}...`
                    : result.content}
                </p>
              ) : null}

              <Link
                href={`/post/${result.slug || result.id}`}
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