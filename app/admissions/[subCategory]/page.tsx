"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";

type AdmissionPost = {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  category?: string;
  subCategory?: string;
  subCategories?: string[];
  createdAt?: any;
};

export default function AdmissionSubCategoryPage() {
  const params = useParams();

  const rawSubCategory =
    typeof params.subCategory === "string"
      ? params.subCategory
      : Array.isArray(params.subCategory)
      ? params.subCategory[0]
      : "";

  const subCategoryName = decodeURIComponent(rawSubCategory);

  const [admissions, setAdmissions] = useState<AdmissionPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdmissions = async () => {
      try {
        setLoading(true);

        const snapshot = await getDocs(collection(db, "posts"));

        const admissionList: AdmissionPost[] = snapshot.docs
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
              item.category === "admissions" &&
              Array.isArray(item.subCategories) &&
              item.subCategories.includes(subCategoryName)
            );
          })
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          });

        setAdmissions(admissionList);
      } catch (error) {
        console.error(error);
        alert("Failed to load admissions");
      } finally {
        setLoading(false);
      }
    };

    loadAdmissions();
  }, [subCategoryName]);

  return (
    <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <Link
          href="/admissions"
          style={{ color: "#2563eb", textDecoration: "none" }}
        >
          ← Back to Admissions
        </Link>

        <h1 style={{ marginTop: "16px" }}>{subCategoryName}</h1>
        <p>Latest admission updates listed under {subCategoryName}.</p>
      </div>

      {loading ? (
        <p>Loading admissions...</p>
      ) : admissions.length === 0 ? (
        <div
          style={{
            background: "white",
            padding: "20px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
          }}
        >
          <p>No admissions found in this subcategory.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          {admissions.map((admission) => (
            <div
              key={admission.id}
              style={{
                background: "white",
                padding: "18px",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>{admission.title}</h2>

              {admission.content ? (
                <p style={{ color: "#4b5563" }}>
                  {admission.content.length > 160
                    ? `${admission.content.slice(0, 160)}...`
                    : admission.content}
                </p>
              ) : null}

              <Link
                href={`/post/${admission.slug || admission.id}`}
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