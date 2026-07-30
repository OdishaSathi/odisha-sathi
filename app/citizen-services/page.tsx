"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getActiveAdminSubCategories } from "@/lib/adminSubCategories";
import { isPublicListingPost } from "@/lib/publicPostQuality";

type PostRow = {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  subCategory?: string;
  subCategoryLabel?: string;
  shortDescription?: string;
  createdAt?: any;
};

type CategoryRow = {
  label: string;
  value: string;
  description?: string;
};

function getTimeValue(item: PostRow) {
  return item.createdAt?.seconds || 0;
}

function getPostHref(item: PostRow) {
  return item.category === "citizen-services"
    ? `/citizen-services/${item.slug || item.id}`
    : `/post/${item.slug || item.id}`;
}

export default function CitizenServicesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [services, setServices] = useState<PostRow[]>([]);
  const [latestPosts, setLatestPosts] = useState<PostRow[]>([]);
  const [visibleCount, setVisibleCount] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [snapshot, managedCategories] = await Promise.all([
          getDocs(collection(db, "posts")),
          getActiveAdminSubCategories("citizen-services"),
        ]);

        const allPosts = snapshot.docs
          .map((item) => ({
            id: item.id,
            title:
              item.data().title ||
              item.data().schemeName ||
              "Odisha Sathi Update",
            slug: item.data().slug || "",
            category: item.data().category || "",
            subCategory: item.data().subCategory || "",
            subCategoryLabel: item.data().subCategoryLabel || "",
            shortDescription:
              item.data().shortDescription ||
              item.data().description ||
              item.data().content ||
              "",
            createdAt: item.data().createdAt || null,
            status: item.data().status,
            published: item.data().published,
          }))
          .filter((item) => isPublicListingPost(item, item.id))
          .sort((a, b) => getTimeValue(b) - getTimeValue(a));

        setServices(
          allPosts.filter((item) => item.category === "citizen-services")
        );
        setLatestPosts(
          allPosts
            .filter(
              (item) =>
                item.category !== "tools" &&
                item.category !== "schemes"
            )
            .slice(0, 8)
        );
        setCategories(
          managedCategories.map((item) => ({
            label: item.label,
            value: item.value,
            description: "",
          }))
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <main className="citizen-page">
      <div className="citizen-container">
        <header className="citizen-page-head">
          <p>ODISHA SATHI CITIZEN SERVICES</p>
          <h1>Citizen Services</h1>
          <span>
            Find service requirements, documents, fees, application process
            and official links.
          </span>
        </header>

        <section className="citizen-category-grid">
          {categories.map((category, index) => (
            <Link
              href={`/citizen-services/category/${encodeURIComponent(
                category.value
              )}`}
              className={`citizen-category-tile tile-${index % 8}`}
              key={category.value}
            >
              <span>Citizen Service</span>
              <h2>{category.label}</h2>
              <p>
                {
                  services.filter(
                    (item) =>
                      item.subCategory === category.value ||
                      item.subCategoryLabel === category.label
                  ).length
                }{" "}
                service posts
              </p>
            </Link>
          ))}
        </section>

        <section className="citizen-all-section">
          <div className="citizen-section-title">
            <h2>All Citizen Services</h2>
            <span>{services.length} services</span>
          </div>

          {loading ? (
            <p className="citizen-status">Loading Citizen Services…</p>
          ) : services.length === 0 ? (
            <p className="citizen-status">No Citizen Services posted yet.</p>
          ) : (
            <>
              <div className="citizen-service-list">
                {services.slice(0, visibleCount).map((service) => (
                  <Link
                    href={`/citizen-services/${service.slug || service.id}`}
                    key={service.id}
                  >
                    <span>
                      {service.subCategoryLabel ||
                        service.subCategory ||
                        "Citizen Service"}
                    </span>
                    <strong>{service.title}</strong>
                    {service.shortDescription ? (
                      <p>{service.shortDescription}</p>
                    ) : null}
                  </Link>
                ))}
              </div>
              {visibleCount < services.length ? (
                <button
                  type="button"
                  className="citizen-view-more"
                  onClick={() => setVisibleCount((value) => value + 30)}
                >
                  View More
                </button>
              ) : null}
            </>
          )}
        </section>

        <section className="citizen-latest-section">
          <div className="citizen-section-title">
            <h2>Latest Posts</h2>
            <Link href="/">View All</Link>
          </div>
          <div className="citizen-latest-lines">
            {latestPosts.map((post, index) => (
              <Link
                href={getPostHref(post)}
                className={`latest-line line-${index % 8}`}
                key={`${post.category}-${post.id}`}
              >
                <span>{post.category?.replace(/-/g, " ")}</span>
                <strong>{post.title}</strong>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <style jsx global>{`
        .citizen-page {
          min-height: 100vh;
          background: #ffffff;
          color: #0f172a;
        }
        .citizen-container {
          width: min(1180px, calc(100% - 28px));
          margin: 0 auto;
          padding: 22px 0 42px;
        }
        .citizen-page-head {
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        .citizen-page-head p {
          margin: 0 0 5px;
          color: #ea580c;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.07em;
        }
        .citizen-page-head h1 {
          margin: 0;
          font-size: clamp(28px, 4vw, 38px);
          font-weight: 950;
          letter-spacing: -0.04em;
        }
        .citizen-page-head span {
          display: block;
          margin-top: 7px;
          color: #475569;
        }
        .citizen-category-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 13px;
          margin: 18px 0;
        }
        .citizen-category-tile {
          min-height: 126px;
          padding: 16px;
          border-radius: 16px;
          color: #ffffff;
          text-decoration: none;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.12);
          transition: transform 0.16s ease;
        }
        .citizen-category-tile:hover {
          transform: translateY(-2px);
        }
        .citizen-category-tile span {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          opacity: 0.82;
        }
        .citizen-category-tile h2 {
          margin: 8px 0 5px;
          font-size: 18px;
          line-height: 1.25;
        }
        .citizen-category-tile p {
          margin: 0;
          font-size: 12px;
          font-weight: 750;
          opacity: 0.9;
        }
        .tile-0 { background: linear-gradient(135deg, #2563eb, #1e3a8a); }
        .tile-1 { background: linear-gradient(135deg, #0f766e, #134e4a); }
        .tile-2 { background: linear-gradient(135deg, #ea580c, #9a3412); }
        .tile-3 { background: linear-gradient(135deg, #7c3aed, #4c1d95); }
        .tile-4 { background: linear-gradient(135deg, #db2777, #831843); }
        .tile-5 { background: linear-gradient(135deg, #16a34a, #14532d); }
        .tile-6 { background: linear-gradient(135deg, #ca8a04, #713f12); }
        .tile-7 { background: linear-gradient(135deg, #0891b2, #164e63); }
        .citizen-all-section,
        .citizen-latest-section {
          margin-top: 18px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #ffffff;
        }
        .citizen-section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        .citizen-section-title h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 950;
        }
        .citizen-section-title span,
        .citizen-section-title a {
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
        }
        .citizen-service-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .citizen-service-list > a {
          min-height: 108px;
          padding: 15px 16px;
          border-right: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          color: inherit;
          text-decoration: none;
        }
        .citizen-service-list > a:hover {
          background: #f0fdfa;
        }
        .citizen-service-list span {
          color: #0f766e;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .citizen-service-list strong {
          display: block;
          margin-top: 5px;
          line-height: 1.4;
        }
        .citizen-service-list p {
          display: -webkit-box;
          overflow: hidden;
          margin: 5px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.4;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }
        .citizen-status {
          margin: 0;
          padding: 18px;
          color: #64748b;
        }
        .citizen-view-more {
          display: block;
          margin: 16px auto;
          border: 1px solid #0f766e;
          border-radius: 999px;
          padding: 9px 16px;
          background: #ffffff;
          color: #0f766e;
          font-weight: 900;
          cursor: pointer;
        }
        .citizen-latest-lines {
          display: grid;
          gap: 7px;
          padding: 12px;
        }
        .latest-line {
          display: grid;
          grid-template-columns: 130px minmax(0, 1fr);
          gap: 10px;
          align-items: center;
          min-height: 42px;
          padding: 8px 11px;
          border-left: 5px solid currentColor;
          border-radius: 8px;
          background: #f8fafc;
          color: #1d4ed8;
          text-decoration: none;
        }
        .latest-line span {
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .latest-line strong {
          color: #0f172a;
          font-size: 13px;
        }
        .line-1 { color: #0f766e; }
        .line-2 { color: #ea580c; }
        .line-3 { color: #7c3aed; }
        .line-4 { color: #db2777; }
        .line-5 { color: #16a34a; }
        .line-6 { color: #ca8a04; }
        .line-7 { color: #0891b2; }
        @media (max-width: 900px) {
          .citizen-category-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 620px) {
          .citizen-category-grid,
          .citizen-service-list {
            grid-template-columns: 1fr;
          }
          .latest-line {
            grid-template-columns: 1fr;
            gap: 3px;
          }
        }
      `}</style>
    </main>
  );
}
