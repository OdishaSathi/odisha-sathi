"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getActiveAdminSubCategories } from "@/lib/adminSubCategories";
import { isPublicListingPost } from "@/lib/publicPostQuality";

type ServiceRow = {
  id: string;
  title: string;
  slug?: string;
  subCategory?: string;
  subCategoryLabel?: string;
  shortDescription?: string;
  createdAt?: any;
};

function normalize(value?: string) {
  return String(value || "").trim().toLowerCase();
}

export default function CitizenServiceCategoryPage() {
  const params = useParams();
  const selected = decodeURIComponent(
    typeof params.subCategory === "string" ? params.subCategory : ""
  );
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [categoryLabel, setCategoryLabel] = useState(selected.replace(/-/g, " "));
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(30);

  useEffect(() => {
    async function loadData() {
      try {
        const [snapshot, categories] = await Promise.all([
          getDocs(collection(db, "posts")),
          getActiveAdminSubCategories("citizen-services"),
        ]);
        const matchedCategory = categories.find(
          (item) =>
            normalize(item.value) === normalize(selected) ||
            normalize(item.label) === normalize(selected)
        );
        if (matchedCategory) setCategoryLabel(matchedCategory.label);

        setServices(
          snapshot.docs
            .map((item) => ({
              id: item.id,
              title: item.data().title || "Citizen Service",
              slug: item.data().slug || "",
              category: item.data().category || "",
              subCategory: item.data().subCategory || "",
              subCategoryLabel: item.data().subCategoryLabel || "",
              subCategories: Array.isArray(item.data().subCategories)
                ? item.data().subCategories
                : [],
              shortDescription: item.data().shortDescription || "",
              createdAt: item.data().createdAt || null,
              status: item.data().status,
              published: item.data().published,
            }))
            .filter(
              (item) =>
                item.category === "citizen-services" &&
                isPublicListingPost(item, item.id) &&
                (normalize(item.subCategory) === normalize(selected) ||
                  normalize(item.subCategoryLabel) === normalize(selected) ||
                  item.subCategories.some(
                    (value: string) => normalize(value) === normalize(selected)
                  ))
            )
            .sort(
              (a, b) =>
                (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
            )
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selected]);

  const visibleServices = useMemo(
    () => services.slice(0, visibleCount),
    [services, visibleCount]
  );

  return (
    <main className="citizen-category-page">
      <div className="citizen-category-container">
        <Link href="/citizen-services" className="citizen-category-back">
          ← Citizen Services
        </Link>
        <header>
          <p>Citizen Services Subcategory</p>
          <h1>{categoryLabel}</h1>
          <span>{services.length} related services</span>
        </header>

        {loading ? (
          <div className="citizen-category-status">Loading services…</div>
        ) : services.length === 0 ? (
          <div className="citizen-category-status">
            No service posts are available in this subcategory.
          </div>
        ) : (
          <>
            <section className="citizen-category-list">
              {visibleServices.map((service, index) => (
                <Link
                  href={`/citizen-services/${service.slug || service.id}`}
                  className={`service-color-${index % 8}`}
                  key={service.id}
                >
                  <span>{categoryLabel}</span>
                  <h2>{service.title}</h2>
                  {service.shortDescription ? (
                    <p>{service.shortDescription}</p>
                  ) : null}
                </Link>
              ))}
            </section>
            {visibleCount < services.length ? (
              <button
                type="button"
                onClick={() => setVisibleCount((value) => value + 30)}
              >
                View More
              </button>
            ) : null}
          </>
        )}
      </div>

      <style jsx global>{`
        .citizen-category-page {
          min-height: 100vh;
          background: #ffffff;
          color: #0f172a;
        }
        .citizen-category-container {
          width: min(980px, calc(100% - 28px));
          margin: 0 auto;
          padding: 22px 0 42px;
        }
        .citizen-category-back {
          color: #1d4ed8;
          font-weight: 850;
          text-decoration: none;
        }
        .citizen-category-container header {
          margin: 15px 0 18px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e5e7eb;
        }
        .citizen-category-container header p {
          margin: 0 0 4px;
          color: #ea580c;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .citizen-category-container header h1 {
          margin: 0;
          font-size: clamp(27px, 4vw, 38px);
          font-weight: 950;
        }
        .citizen-category-container header span {
          display: block;
          margin-top: 5px;
          color: #64748b;
        }
        .citizen-category-list {
          display: grid;
          gap: 12px;
        }
        .citizen-category-list > a {
          display: block;
          min-height: 112px;
          padding: 16px 18px;
          border-left: 7px solid currentColor;
          border-radius: 13px;
          background: #f8fafc;
          color: #2563eb;
          text-decoration: none;
          box-shadow: 0 5px 16px rgba(15, 23, 42, 0.06);
        }
        .citizen-category-list > a:hover {
          background: #f0fdfa;
        }
        .citizen-category-list span {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .citizen-category-list h2 {
          margin: 5px 0;
          color: #0f172a;
          font-size: 18px;
        }
        .citizen-category-list p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }
        .service-color-1 { color: #0f766e !important; }
        .service-color-2 { color: #ea580c !important; }
        .service-color-3 { color: #7c3aed !important; }
        .service-color-4 { color: #db2777 !important; }
        .service-color-5 { color: #16a34a !important; }
        .service-color-6 { color: #ca8a04 !important; }
        .service-color-7 { color: #0891b2 !important; }
        .citizen-category-container > button {
          display: block;
          margin: 18px auto 0;
          border: 1px solid #0f766e;
          border-radius: 999px;
          padding: 9px 16px;
          background: #ffffff;
          color: #0f766e;
          font-weight: 900;
          cursor: pointer;
        }
        .citizen-category-status {
          padding: 18px;
          border: 1px solid #e5e7eb;
          border-radius: 13px;
          color: #64748b;
        }
      `}</style>
    </main>
  );
}
