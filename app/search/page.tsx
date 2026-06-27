"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

type SearchPost = {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  content?: string;
  schemeName?: string;
  department?: string;
  description?: string;
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

function getPostLink(post: SearchPost) {
  if (post.category === "schemes") {
    return `/schemes/${post.id}`;
  }

  return `/post/${post.slug || post.id}`;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSearchResults = async () => {
      const params = new URLSearchParams(window.location.search);
      const searchText = params.get("q") || "";
      const cleanSearch = searchText.trim().toLowerCase();

      setQuery(searchText);

      if (!cleanSearch) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const snapshot = await getDocs(collection(db, "posts"));

        const allPosts: SearchPost[] = snapshot.docs
          .map((docItem) => {
            const data = docItem.data();

            return {
              id: docItem.id,
              title: data.title || "",
              slug: data.slug || "",
              category: data.category || "",
              content: data.content || "",
              schemeName: data.schemeName || data.title || "",
              department: data.department || "",
              description: data.description || data.content || "",
              createdAt: data.createdAt || null,
            };
          })
          .filter((post) => post.category !== "tools");

        const filteredResults = allPosts
          .filter((post) => {
            const combinedText = [
              post.title,
              post.schemeName,
              post.department,
              post.content,
              post.description,
              post.category,
            ]
              .join(" ")
              .toLowerCase();

            return combinedText.includes(cleanSearch);
          })
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          });

        setResults(filteredResults);
      } catch (error) {
        console.error(error);
        alert("Failed to load search results");
      } finally {
        setLoading(false);
      }
    };

    loadSearchResults();
  }, []);

  return (
    <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
      <div style={{ marginBottom: "22px" }}>
        <p style={{ marginBottom: "8px" }}>
          <Link href="/" style={{ color: "#2563eb", textDecoration: "none" }}>
            Home
          </Link>{" "}
          / Search
        </p>

        <h1 style={{ marginTop: 0 }}>Search Odisha Sathi</h1>

        <p style={{ color: "#4b5563" }}>
          You searched for: <strong>{query || "No search keyword"}</strong>
        </p>
      </div>

      {loading ? (
        <div
          style={{
            background: "white",
            padding: "18px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
          }}
        >
          <p style={{ margin: 0 }}>Searching...</p>
        </div>
      ) : !query.trim() ? (
        <div
          style={{
            background: "white",
            padding: "18px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
          }}
        >
          <p style={{ margin: 0 }}>Please enter a search keyword.</p>
        </div>
      ) : results.length === 0 ? (
        <div
          style={{
            background: "white",
            padding: "18px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
          }}
        >
          <p style={{ margin: 0 }}>No results found.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {results.map((post) => {
            const displayTitle =
              post.category === "schemes"
                ? post.schemeName || post.title || "Untitled Scheme"
                : post.title || "Untitled Post";

            const displayText =
              post.category === "schemes"
                ? post.department || "Department not added"
                : post.content || post.description || "";

            return (
              <Link
                key={post.id}
                href={getPostLink(post)}
                style={{
                  display: "block",
                  background: "white",
                  padding: "16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    marginBottom: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      padding: "4px 8px",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    {getCategoryLabel(post.category)}
                  </span>
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "19px",
                    color: "#111827",
                    lineHeight: "1.4",
                  }}
                >
                  {displayTitle}
                </h2>

                {displayText ? (
                  <p
                    style={{
                      margin: "7px 0 0",
                      color: "#4b5563",
                      lineHeight: "1.5",
                    }}
                  >
                    {displayText.length > 150
                      ? `${displayText.slice(0, 150)}...`
                      : displayText}
                  </p>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}