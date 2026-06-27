"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

const ADMISSION_SUB_CATEGORIES = [
  "+2 Admission",
  "+3 Admission",
  "Diploma Admission",
  "ITI Admission",
  "B.Ed Admission",
  "Entrance Admission",
  "University Admission",
  "Other Admission",
];

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

export default function AdmissionsPage() {
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
          .filter((item) => item.category === "admissions")
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          })
          .slice(0, 10);

        setAdmissions(admissionList);
      } catch (error) {
        console.error(error);
        alert("Failed to load admissions");
      } finally {
        setLoading(false);
      }
    };

    loadAdmissions();
  }, []);

  return (
    <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
      <section
        style={{
          background: "linear-gradient(135deg, #eff6ff, #ffffff)",
          padding: "28px",
          borderRadius: "16px",
          border: "1px solid #dbeafe",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Latest Admissions</h1>
        <p style={{ color: "#4b5563", marginBottom: 0 }}>
          Check latest +2 admission, +3 admission, diploma admission, ITI
          admission, university admission and entrance admission updates.
        </p>
      </section>

      <section
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Admission Categories</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          {ADMISSION_SUB_CATEGORIES.map((item) => (
            <Link
              key={item}
              href={`/admissions/${encodeURIComponent(item)}`}
              style={{
                display: "block",
                padding: "14px",
                border: "1px solid #dbeafe",
                borderRadius: "12px",
                background: "#f8fbff",
                color: "#1d4ed8",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              {item}
            </Link>
          ))}
        </div>
      </section>

      <section
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Recently Added Admissions</h2>

        {loading ? (
          <p>Loading admissions...</p>
        ) : admissions.length === 0 ? (
          <p>No admissions found.</p>
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            {admissions.map((admission) => (
              <div
                key={admission.id}
                style={{
                  padding: "16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                }}
              >
                <h3 style={{ marginTop: 0 }}>{admission.title}</h3>

                {admission.subCategories &&
                admission.subCategories.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginBottom: "10px",
                    }}
                  >
                    {admission.subCategories.map((item) => (
                      <span
                        key={item}
                        style={{
                          padding: "5px 9px",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          borderRadius: "999px",
                          fontSize: "13px",
                          border: "1px solid #bfdbfe",
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}

                {admission.content ? (
                  <p style={{ color: "#4b5563" }}>
                    {admission.content.length > 150
                      ? `${admission.content.slice(0, 150)}...`
                      : admission.content}
                  </p>
                ) : null}

                <Link
                  href={`/post/${admission.slug || admission.id}`}
                  style={{
                    display: "inline-block",
                    marginTop: "8px",
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
      </section>
    </main>
  );
}