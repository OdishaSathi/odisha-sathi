"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

const ADMIT_CARD_SUB_CATEGORIES = [
  "Recruitment Admit Cards",
  "Entrance Admit Cards",
  "Board Admit Cards",
  "University Admit Cards",
  "School Admit Cards",
  "Exam City Intimation",
  "Hall Tickets",
  "Other Admit Cards",
];

type AdmitCardPost = {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  category?: string;
  subCategory?: string;
  subCategories?: string[];
  createdAt?: any;
};

export default function AdmitCardsPage() {
  const [admitCards, setAdmitCards] = useState<AdmitCardPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdmitCards = async () => {
      try {
        setLoading(true);

        const snapshot = await getDocs(collection(db, "posts"));

        const admitCardList: AdmitCardPost[] = snapshot.docs
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
          .filter((item) => item.category === "admit-cards")
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          })
          .slice(0, 10);

        setAdmitCards(admitCardList);
      } catch (error) {
        console.error(error);
        alert("Failed to load admit cards");
      } finally {
        setLoading(false);
      }
    };

    loadAdmitCards();
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
        <h1 style={{ marginTop: 0 }}>Latest Admit Cards</h1>
        <p style={{ color: "#4b5563", marginBottom: 0 }}>
          Check recruitment admit cards, entrance admit cards, board admit
          cards, university admit cards, exam city intimation and hall tickets.
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
        <h2 style={{ marginTop: 0 }}>Admit Card Categories</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          {ADMIT_CARD_SUB_CATEGORIES.map((item) => (
            <Link
              key={item}
              href={`/admit-cards/${encodeURIComponent(item)}`}
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
        <h2 style={{ marginTop: 0 }}>Recently Added Admit Cards</h2>

        {loading ? (
          <p>Loading admit cards...</p>
        ) : admitCards.length === 0 ? (
          <p>No admit cards found.</p>
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            {admitCards.map((admitCard) => (
              <div
                key={admitCard.id}
                style={{
                  padding: "16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                }}
              >
                <h3 style={{ marginTop: 0 }}>{admitCard.title}</h3>

                {admitCard.subCategories &&
                admitCard.subCategories.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginBottom: "10px",
                    }}
                  >
                    {admitCard.subCategories.map((item) => (
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

                {admitCard.content ? (
                  <p style={{ color: "#4b5563" }}>
                    {admitCard.content.length > 150
                      ? `${admitCard.content.slice(0, 150)}...`
                      : admitCard.content}
                  </p>
                ) : null}

                <Link
                  href={`/post/${admitCard.slug || admitCard.id}`}
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