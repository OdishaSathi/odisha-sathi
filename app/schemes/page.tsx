"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

type SchemePost = {
  id: string;
  title?: string;
  schemeName?: string;
  department?: string;
  category?: string;
  createdAt?: any;
};

export default function SchemesPage() {
  const [schemes, setSchemes] = useState<SchemePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSchemes = async () => {
      try {
        setLoading(true);

        const snapshot = await getDocs(collection(db, "posts"));

        const schemeList: SchemePost[] = snapshot.docs
          .map((docItem) => {
            const data = docItem.data();

            return {
              id: docItem.id,
              title: data.title || "",
              schemeName: data.schemeName || data.title || "",
              department: data.department || "",
              category: data.category || "",
              createdAt: data.createdAt || null,
            };
          })
          .filter((item) => item.category === "schemes")
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          });

        setSchemes(schemeList);
      } catch (error) {
        console.error(error);
        alert("Failed to load schemes");
      } finally {
        setLoading(false);
      }
    };

    loadSchemes();
  }, []);

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
      <section style={{ marginBottom: "22px" }}>
        <h1 style={{ marginBottom: "8px" }}>Government Schemes</h1>
        <p style={{ color: "#4b5563", margin: 0 }}>
          Latest government scheme information with official links and PDF.
        </p>
      </section>

      {loading ? (
        <p>Loading schemes...</p>
      ) : schemes.length === 0 ? (
        <div
          style={{
            background: "white",
            padding: "18px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
          }}
        >
          <p style={{ margin: 0 }}>No schemes found.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {schemes.map((scheme, index) => {
            const name = scheme.schemeName || scheme.title || "Untitled Scheme";

            return (
              <Link
                key={scheme.id}
                href={`/schemes/${scheme.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "42px 1fr",
                  gap: "12px",
                  padding: "14px",
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "999px",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    fontSize: "14px",
                  }}
                >
                  {index + 1}
                </div>

                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      color: "#1d4ed8",
                    }}
                  >
                    {name}
                  </h2>

                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#4b5563",
                      fontSize: "14px",
                    }}
                  >
                    {scheme.department || "Department not added"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}