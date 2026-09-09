"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { isPublicListingPost } from "@/lib/publicPostQuality";
import type { PublicRecord } from "@/lib/publicRecords";
import {
  buildCitizenServiceSearchText,
  filterCitizenServices,
} from "@/lib/citizenServiceDiscovery";

type ServiceRow = {
  id: string;
  title: string;
  slug?: string;
  subCategory?: string;
  subCategoryLabel?: string;
  shortDescription?: string;
  searchText?: string;
  createdAt?: any;
};

function normalize(value?: string) {
  return String(value || "").trim().toLowerCase();
}


function buildCategoryData(
  groups: Record<string, PublicRecord[]>,
  selected: string
) {
  const categories = (groups.subCategories || [])
    .map((record) => ({
      id: record.id,
      parentSection: String(record.data.parentSection || "").trim(),
      label: String(record.data.name || "").trim(),
      value: String(record.data.slug || "").trim(),
      displayOrder: Number(record.data.displayOrder || 999),
      status: record.data.status === "hidden" ? "hidden" : "active",
    }))
    .filter(
      (item) =>
        item.parentSection === "citizen-services" &&
        item.status !== "hidden" &&
        item.label &&
        item.value
    )
    .sort((a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label));

  const matchedCategory = categories.find(
    (item) =>
      normalize(item.value) === normalize(selected) ||
      normalize(item.label) === normalize(selected)
  );

  const services = (groups.posts || [])
    .map((record) => ({
      id: record.id,
      title: record.data.title || "Citizen Service",
      slug: record.data.slug || "",
      category: record.data.category || "",
      subCategory: record.data.subCategory || "",
      subCategoryLabel: record.data.subCategoryLabel || "",
      subCategories: Array.isArray(record.data.subCategories)
        ? record.data.subCategories
        : [],
      shortDescription: record.data.shortDescription || "",
      searchText: buildCitizenServiceSearchText(
        record.data as Record<string, unknown>
      ),
      createdAt: record.data.createdAt || null,
      status: record.data.status,
      published: record.data.published,
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
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );

  return {
    categoryLabel: matchedCategory?.label || selected.replace(/-/g, " "),
    services,
  };
}

export default function CitizenServiceCategoryPageClient({
  selected,
  initialGroups,
}: {
  selected: string;
  initialGroups: Record<string, PublicRecord[]>;
}) {
  const { services, categoryLabel } = useMemo(
    () => buildCategoryData(initialGroups, selected),
    [initialGroups, selected]
  );
  const [visibleCount, setVisibleCount] = useState(30);
  const [query, setQuery] = useState("");

  const filteredServices = useMemo(
    () => filterCitizenServices(services, query),
    [services, query]
  );

  const visibleServices = useMemo(
    () => filteredServices.slice(0, visibleCount),
    [filteredServices, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(30);
  }, [query]);

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

        {services.length > 0 ? (
          <div className="citizen-category-search-row">
            <label className="citizen-category-search">
              <span className="sr-only">Search this Citizen Services category</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${categoryLabel}...`}
                aria-label={`Search ${categoryLabel} Citizen Services`}
              />
              {query ? (
                <button type="button" onClick={() => setQuery("")}>Clear</button>
              ) : null}
            </label>
            {query ? (
              <span>{filteredServices.length} match{filteredServices.length === 1 ? "" : "es"}</span>
            ) : null}
          </div>
        ) : null}

        {services.length === 0 ? (
          <div className="citizen-category-status">
            No service posts are available in this subcategory.
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="citizen-category-status">
            No services match “{query.trim()}” in this category.
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
            {visibleCount < filteredServices.length ? (
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
        .citizen-category-search-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: -4px 0 16px;
        }
        .citizen-category-search {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          border: 1px solid #dbe3ea;
          border-radius: 9px;
          background: #ffffff;
        }
        .citizen-category-search input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          padding: 9px 11px;
          background: transparent;
          color: #0f172a;
          font: inherit;
          font-size: 13px;
        }
        .citizen-category-search button {
          align-self: stretch;
          border: 0;
          border-left: 1px solid #e5e7eb;
          padding: 0 11px;
          background: #ffffff;
          color: #0f766e;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }
        .citizen-category-search-row > span {
          flex: 0 0 auto;
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
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
        @media (max-width: 620px) {
          .citizen-category-search-row {
            align-items: stretch;
            flex-direction: column;
            gap: 6px;
          }
          .citizen-category-search-row > span {
            padding-left: 2px;
          }
        }
      `}</style>
    </main>
  );
}
