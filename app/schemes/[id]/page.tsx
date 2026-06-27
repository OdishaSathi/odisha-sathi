"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

type SchemePost = {
  id: string;
  title?: string;
  schemeName?: string;
  department?: string;
  description?: string;
  content?: string;
  officialSite?: string;
  officialPdf?: string;
  category?: string;
};

export default function SchemeDetailsPage() {
  const params = useParams();

  const schemeId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : "";

  const [scheme, setScheme] = useState<SchemePost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadScheme = async () => {
      if (!schemeId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const ref = doc(db, "posts", schemeId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setScheme(null);
          return;
        }

        const data = snap.data();

        if (data.category !== "schemes") {
          setScheme(null);
          return;
        }

        setScheme({
          id: snap.id,
          title: data.title || "",
          schemeName: data.schemeName || data.title || "",
          department: data.department || "",
          description: data.description || data.content || "",
          content: data.content || "",
          officialSite: data.officialSite || "",
          officialPdf: data.officialPdf || "",
          category: data.category || "",
        });
      } catch (error) {
        console.error(error);
        alert("Failed to load scheme");
      } finally {
        setLoading(false);
      }
    };

    loadScheme();
  }, [schemeId]);

  if (loading) {
    return (
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
        <p>Loading scheme...</p>
      </main>
    );
  }

  if (!scheme) {
    return (
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
        <Link
          href="/schemes"
          style={{ color: "#2563eb", textDecoration: "none" }}
        >
          ← Back to Schemes
        </Link>

        <div
          style={{
            marginTop: "18px",
            background: "white",
            padding: "20px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
          }}
        >
          <h1>Scheme not found</h1>
          <p>This scheme may have been removed or the link may be wrong.</p>
        </div>
      </main>
    );
  }

  const name = scheme.schemeName || scheme.title || "Untitled Scheme";

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
      <Link
        href="/schemes"
        style={{ color: "#2563eb", textDecoration: "none" }}
      >
        ← Back to Schemes
      </Link>

      <article
        style={{
          marginTop: "18px",
          background: "white",
          padding: "22px",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
        }}
      >
        <h1 style={{ marginTop: 0 }}>{name}</h1>

        <div
          style={{
            padding: "12px",
            background: "#f8fbff",
            border: "1px solid #dbeafe",
            borderRadius: "10px",
            marginBottom: "18px",
          }}
        >
          <strong>Department:</strong>{" "}
          <span>{scheme.department || "Department not added"}</span>
        </div>

        <h2>Scheme Description</h2>

        <div
          style={{
            whiteSpace: "pre-wrap",
            lineHeight: "1.7",
            color: "#374151",
            marginBottom: "22px",
          }}
        >
          {scheme.description || "No description available."}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          {scheme.officialSite ? (
            <a
              href={scheme.officialSite}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "10px 14px",
                background: "#2563eb",
                color: "white",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              Official Site
            </a>
          ) : null}

          {scheme.officialPdf ? (
            <a
              href={scheme.officialPdf}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "10px 14px",
                background: "#16a34a",
                color: "white",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              Official PDF
            </a>
          ) : null}
        </div>
      </article>
    </main>
  );
}