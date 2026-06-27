"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";

type ToolPost = {
  id: string;
  title?: string;
  category?: string;
  toolCategory?: string;
  toolName?: string;
  toolUrl?: string;
  createdAt?: any;
};

function getPageTitle(value: string) {
  if (value === "pdf-tools") return "PDF Tools";
  if (value === "image-tools") return "Image Tools";
  return "Tools";
}

export default function ToolCategoryPage() {
  const params = useParams();

  const toolCategory =
    typeof params?.toolCategory === "string" ? params.toolCategory : "";

  const [tools, setTools] = useState<ToolPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTools() {
      try {
        setLoading(true);

        const snapshot = await getDocs(collection(db, "posts"));

        const list: ToolPost[] = snapshot.docs
          .map((docItem) => {
            const data = docItem.data();

            return {
              id: docItem.id,
              title: data.title || "",
              category: data.category || "",
              toolCategory: data.toolCategory || "",
              toolName: data.toolName || data.title || "",
              toolUrl: data.toolUrl || "",
              createdAt: data.createdAt || null,
            };
          })
          .filter(
            (item) =>
              item.category === "tools" && item.toolCategory === toolCategory
          )
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          });

        setTools(list);
      } catch (error) {
        console.error(error);
        alert("Failed to load tools");
      } finally {
        setLoading(false);
      }
    }

    if (toolCategory) {
      loadTools();
    }
  }, [toolCategory]);

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
      <style>
        {`
          .tool-card-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }

          .tool-rectangle-card {
            min-height: 78px;
            background: white;
            border: 1px solid #dbeafe;
            border-radius: 14px;
            padding: 14px 16px;
            text-decoration: none;
            color: inherit;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            box-shadow: 0 5px 14px rgba(15, 23, 42, 0.05);
          }

          .tool-rectangle-card:hover {
            border-color: #2563eb;
            box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
          }

          .tool-card-title {
            margin: 0;
            font-size: 17px;
            color: #1d4ed8;
            line-height: 1.35;
          }

          .tool-card-open {
            font-size: 13px;
            color: #2563eb;
            font-weight: 700;
            white-space: nowrap;
          }

          @media (max-width: 640px) {
            .tool-card-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <section style={{ marginBottom: "24px" }}>
        <p style={{ marginTop: 0, marginBottom: "8px" }}>
          <Link
            href="/tools"
            style={{ color: "#2563eb", textDecoration: "none" }}
          >
            Tools
          </Link>{" "}
          / {getPageTitle(toolCategory)}
        </p>

        <h1 style={{ margin: 0 }}>{getPageTitle(toolCategory)}</h1>
      </section>

      {loading ? (
        <div
          style={{
            background: "white",
            padding: "18px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
          }}
        >
          Loading tools...
        </div>
      ) : tools.length === 0 ? (
        <div
          style={{
            background: "white",
            padding: "18px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
          }}
        >
          No tools added yet.
        </div>
      ) : (
        <section className="tool-card-grid">
          {tools.map((tool) => {
            const name = tool.toolName || tool.title || "Untitled Tool";

            return (
              <a
                key={tool.id}
                href={tool.toolUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="tool-rectangle-card"
              >
                <h2 className="tool-card-title">{name}</h2>
                <span className="tool-card-open">Open →</span>
              </a>
            );
          })}
        </section>
      )}
    </main>
  );
}