"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import ReminderShareButtons from "@/components/public/ReminderShareButtons";

const ADMISSION_SUB_CATEGORIES = [
  "Odisha Admissions",
  "Central Admissions",
  "School Admissions",
  "+2 Admissions",
  "+3 Admissions",
  "Diploma Admissions",
  "ITI Admissions",
  "Entrance Admissions",
  "University Admissions",
  "Distance Education",
];

const ADMISSION_COLLECTIONS = ["posts", "admissions", "admission"];

const POSTS_PER_PAGE = 30;
const LATEST_STACK_COUNT = 8;

type ImportantDate = {
  label?: string;
  value?: string;
};

type AdmissionPost = {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  description?: string;
  category?: string;
  subCategory?: string;
  subCategories?: string[];
  admissionCategory?: string;
  admissionCategories?: string[];
  categoryName?: string;
  categorySlug?: string;
  subCategorySlug?: string;
  categories?: string[];
  courseName?: string;
  admissionName?: string;
  department?: string;
  institute?: string;
  organization?: string;
  startDate?: string;
  applicationStartDate?: string;
  applicationStartDateDisplay?: string;
  startDateDisplay?: string;
  admissionStartDate?: string;
  onlineApplyStartDate?: string;
  applyStartDate?: string;
  openingDate?: string;
  lastDate?: string;
  applicationLastDate?: string;
  lastDateDisplay?: string;
  admissionLastDate?: string;
  applicationEndDate?: string;
  closingDate?: string;
  endDate?: string;
  publishedDate?: string;
  importantDates?: ImportantDate[];
  published?: boolean;
  createdAt?: any;
  sourceCollection?: string;
};

function getSafeParamValue(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value || "";

  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}

function normalizeText(value?: string) {
  return (value || "").trim().toLowerCase();
}

function normalizeCategoryKey(value?: string) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/&/g, "and")
    .replace(/admissions/g, "admission")
    .replace(/results/g, "result")
    .replace(/schemes/g, "scheme")
    .replace(/cards/g, "card")
    .replace(/exams/g, "exam")
    .replace(/[^a-z0-9]/g, "");
}

function getSearchText(item: AdmissionPost) {
  return normalizeCategoryKey(
    [
      item.title,
      item.content,
      item.description,
      item.courseName,
      item.admissionName,
      item.department,
      item.institute,
      item.organization,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function getTimeValue(item: AdmissionPost) {
  return item.createdAt?.seconds || 0;
}

function parseDateValue(value?: any) {
  if (!value) return null;

  if (typeof value === "object" && typeof value.seconds === "number") {
    const date = new Date(value.seconds * 1000);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  if (typeof value !== "string") return null;

  const cleanValue = value.trim();

  if (!cleanValue) return null;

  const ddMmYyyy = cleanValue.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);

  if (ddMmYyyy) {
    const day = Number(ddMmYyyy[1]);
    const month = Number(ddMmYyyy[2]);
    const year = Number(ddMmYyyy[3]);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  const yyyyMmDd = cleanValue.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);

  if (yyyyMmDd) {
    const year = Number(yyyyMmDd[1]);
    const month = Number(yyyyMmDd[2]);
    const day = Number(yyyyMmDd[3]);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  const date = new Date(cleanValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(value?: any) {
  if (!value) return "";

  const parsedDate = parseDateValue(value);

  if (!parsedDate) {
    return typeof value === "string" ? value.trim() : "";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPublishedDate(item: AdmissionPost) {
  return formatDate(item.createdAt || item.publishedDate);
}

function getRawStartDate(item: AdmissionPost) {
  const directDate =
    item.startDateDisplay ||
    item.applicationStartDateDisplay ||
    item.startDate ||
    item.applicationStartDate ||
    item.admissionStartDate ||
    item.onlineApplyStartDate ||
    item.applyStartDate ||
    item.openingDate ||
    "";

  if (directDate) return directDate;

  const matchedDate = item.importantDates?.find((dateItem) => {
    const label = (dateItem.label || "").toLowerCase();

    return (
      label.includes("start") ||
      label.includes("opening") ||
      label.includes("begin") ||
      label.includes("application begins") ||
      label.includes("apply starts")
    );
  });

  return matchedDate?.value || "";
}

function getRawLastDate(item: AdmissionPost) {
  const directDate =
    item.lastDateDisplay ||
    item.lastDate ||
    item.applicationLastDate ||
    item.admissionLastDate ||
    item.applicationEndDate ||
    item.closingDate ||
    item.endDate ||
    "";

  if (directDate) return directDate;

  const matchedDate = item.importantDates?.find((dateItem) => {
    const label = (dateItem.label || "").toLowerCase();

    return (
      label.includes("last") ||
      label.includes("closing") ||
      label.includes("end") ||
      label.includes("deadline")
    );
  });

  return matchedDate?.value || "";
}

function getStartDate(item: AdmissionPost) {
  return formatDate(getRawStartDate(item));
}

function getLastDate(item: AdmissionPost) {
  return formatDate(getRawLastDate(item));
}

function getAdmissionMeta(item: AdmissionPost) {
  return (
    item.courseName ||
    item.admissionName ||
    item.department ||
    item.institute ||
    item.organization ||
    item.admissionCategory ||
    "Admission details available"
  );
}

function isAdmissionPost(item: AdmissionPost) {
  const category = normalizeText(item.category);
  const sourceCollection = normalizeText(item.sourceCollection);

  return (
    sourceCollection === "admissions" ||
    sourceCollection === "admission" ||
    category === "admissions" ||
    category === "admission"
  );
}

function getCategoryValues(item: AdmissionPost) {
  const values: string[] = [];

  if (item.subCategory) values.push(item.subCategory);
  if (item.admissionCategory) values.push(item.admissionCategory);
  if (item.categoryName) values.push(item.categoryName);
  if (item.categorySlug) values.push(item.categorySlug);
  if (item.subCategorySlug) values.push(item.subCategorySlug);

  if (Array.isArray(item.subCategories)) {
    values.push(...item.subCategories.filter(Boolean));
  }

  if (Array.isArray(item.admissionCategories)) {
    values.push(...item.admissionCategories.filter(Boolean));
  }

  if (Array.isArray(item.categories)) {
    values.push(...item.categories.filter(Boolean));
  }

  return values;
}

function inferCategoryMatchFromText(
  item: AdmissionPost,
  selectedSubCategory: string
) {
  const selectedKey = normalizeCategoryKey(selectedSubCategory);
  const searchText = getSearchText(item);

  if (!searchText) return false;

  const hasPlus2 =
    searchText.includes("plus2") ||
    searchText.includes("2admission") ||
    searchText.includes("12th") ||
    searchText.includes("hse") ||
    searchText.includes("highersecondary");

  const hasPlus3 =
    searchText.includes("plus3") ||
    searchText.includes("3admission") ||
    searchText.includes("degreeadmission") ||
    searchText.includes("ugadmission");

  if (selectedKey === "plus2admission") {
    return hasPlus2 && !hasPlus3;
  }

  if (selectedKey === "plus3admission") {
    return hasPlus3 && !hasPlus2;
  }

  if (selectedKey === "diplomaadmission") {
    return searchText.includes("diploma") || searchText.includes("polytechnic");
  }

  if (selectedKey === "itiadmission") {
    return searchText.includes("iti");
  }

  if (selectedKey === "entranceadmission") {
    return (
      searchText.includes("entrance") ||
      searchText.includes("ojee") ||
      searchText.includes("cuet") ||
      searchText.includes("jee") ||
      searchText.includes("neet")
    );
  }

  if (selectedKey === "universityadmission") {
    return searchText.includes("university") || searchText.includes("sams");
  }

  if (selectedKey === "distanceeducation") {
    return (
      searchText.includes("distanceeducation") ||
      searchText.includes("distance") ||
      searchText.includes("ignou") ||
      searchText.includes("osou")
    );
  }

  if (selectedKey === "schooladmission") {
    return (
      searchText.includes("school") ||
      searchText.includes("kv") ||
      searchText.includes("kvs") ||
      searchText.includes("oav") ||
      searchText.includes("rte")
    );
  }

  if (selectedKey === "odishaadmission") {
    return (
      searchText.includes("odisha") ||
      searchText.includes("sams") ||
      searchText.includes("ojee") ||
      searchText.includes("ouat") ||
      searchText.includes("osou")
    );
  }

  if (selectedKey === "centraladmission") {
    return (
      searchText.includes("central") ||
      searchText.includes("cbse") ||
      searchText.includes("cuet") ||
      searchText.includes("ignou") ||
      searchText.includes("kvs")
    );
  }

  return false;
}

function matchesSelectedSubCategory(
  item: AdmissionPost,
  selectedSubCategory: string
) {
  const selectedKey = normalizeCategoryKey(selectedSubCategory);

  if (!selectedKey) return false;

  const categoryValues = getCategoryValues(item);

  const directMatch = categoryValues.some((value) => {
    return normalizeCategoryKey(value) === selectedKey;
  });

  if (directMatch) return true;

  return inferCategoryMatchFromText(item, selectedSubCategory);
}

function isDeadlineWithinNext7Days(item: AdmissionPost) {
  const lastDate = parseDateValue(
    item.lastDate ||
      item.applicationLastDate ||
      item.admissionLastDate ||
      item.applicationEndDate ||
      item.closingDate ||
      item.endDate ||
      getRawLastDate(item)
  );

  if (!lastDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextSevenDays = new Date(today);
  nextSevenDays.setDate(today.getDate() + 7);

  return lastDate >= today && lastDate <= nextSevenDays;
}

function getAdmissionKey(item: AdmissionPost) {
  return item.slug || item.id;
}

function LatestAdmissionStack({
  admission,
  index,
}: {
  admission: AdmissionPost;
  index: number;
}) {
  const startDate = getStartDate(admission);
  const lastDate = getLastDate(admission);
  const metaText = getAdmissionMeta(admission);

  return (
    <Link
      href={`/post/${admission.slug || admission.id}`}
      className={`os-admission-stack-card os-admission-stack-color-${index % 8}`}
    >
      <h3>{admission.title || "Untitled Admission"}</h3>

      <p>{metaText}</p>

      <div className="os-admission-stack-date-row">
        {startDate ? (
          <span className="os-admission-stack-start">
            Start Date - {startDate}
          </span>
        ) : null}

        {lastDate ? (
          <span className="os-admission-stack-end">
            Last Date - {lastDate}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function CategoryAdmissionItem({ admission }: { admission: AdmissionPost }) {
  const publishedDate = getPublishedDate(admission);
  const startDate = getStartDate(admission);
  const lastDate = getLastDate(admission);
  const metaText = getAdmissionMeta(admission);

  return (
    <Link
      href={`/post/${admission.slug || admission.id}`}
      className="os-category-admission-item"
    >
      <div>
        <h3>{admission.title || "Untitled Admission"}</h3>
        <p>{metaText}</p>
      </div>

      <div className="os-category-admission-date-grid">
        {publishedDate ? <span>Published: {publishedDate}</span> : null}
        {startDate ? (
          <span className="os-date-green">Start Date: {startDate}</span>
        ) : null}
        {lastDate ? (
          <span className="os-date-red">Last Date: {lastDate}</span>
        ) : null}
      </div>
    </Link>
  );
}

function ReminderItem({ admission }: { admission: AdmissionPost }) {
  const lastDate = getLastDate(admission);

  return (
    <Link
      href={`/post/${admission.slug || admission.id}`}
      className="os-reminder-item"
    >
      <span>{admission.title || "Untitled Admission"}</span>
      {lastDate ? <strong>Last Date: {lastDate}</strong> : null}
    </Link>
  );
}

function buildReminderShareText(
  reminderAdmissions: AdmissionPost[],
  origin: string
) {
  const lines: string[] = ["Odisha Sathi Last Date Reminder", ""];

  reminderAdmissions.forEach((admission, index) => {
    const title = admission.title || "Untitled Admission";
    const lastDate = getLastDate(admission) || "Date not available";
    const postLink = `${origin}/post/${admission.slug || admission.id}`;

    lines.push(title);
    lines.push(`Last Date: ${lastDate}`);
    lines.push(postLink);

    if (index < reminderAdmissions.length - 1) {
      lines.push("");
    }
  });

  return lines.join("\n");
}

export default function AdmissionSubCategoryPage() {
  const params = useParams();

  const subCategoryName =
    getSafeParamValue(params.subCategory as string | string[] | undefined) ||
    getSafeParamValue(params.category as string | string[] | undefined);

  const [admissions, setAdmissions] = useState<AdmissionPost[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [loading, setLoading] = useState(true);

  const latestAdmissions = admissions.slice(0, LATEST_STACK_COUNT);
  const visibleAdmissions = admissions.slice(0, visibleCount);
  const canViewMore = visibleCount < admissions.length;

  const sideCategories = useMemo(() => {
    return Array.from(
      new Map(
        [...ADMISSION_SUB_CATEGORIES, ...availableCategories]
          .filter(Boolean)
          .map((item) => [normalizeCategoryKey(item), item])
      ).values()
    );
  }, [availableCategories]);

  const reminderAdmissions = admissions
    .filter((admission) => isDeadlineWithinNext7Days(admission))
    .sort((a, b) => {
      const dateA = parseDateValue(getRawLastDate(a))?.getTime() || 0;
      const dateB = parseDateValue(getRawLastDate(b))?.getTime() || 0;

      return dateA - dateB;
    });

  const handleShareReminder = () => {
    if (reminderAdmissions.length === 0) return;

    const shareText = buildReminderShareText(
      reminderAdmissions,
      window.location.origin
    );

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    const loadAdmissions = async () => {
      try {
        setLoading(true);

        const allAdmissions: AdmissionPost[] = [];

        for (const collectionName of ADMISSION_COLLECTIONS) {
          const snapshot = await getDocs(collection(db, collectionName));

          snapshot.docs.forEach((docItem) => {
            const data = docItem.data();

            allAdmissions.push({
              id: docItem.id,
              title: data.title || "",
              slug: data.slug || "",
              content: data.content || "",
              description: data.description || "",
              category: data.category || "",
              subCategory: data.subCategory || "",
              subCategories: Array.isArray(data.subCategories)
                ? data.subCategories
                : data.subCategory
                ? [data.subCategory]
                : [],
              admissionCategory:
                data.admissionCategory ||
                data.admissionSubCategory ||
                data.selectedAdmissionCategory ||
                "",
              admissionCategories: Array.isArray(data.admissionCategories)
                ? data.admissionCategories
                : Array.isArray(data.selectedAdmissionCategories)
                ? data.selectedAdmissionCategories
                : [],
              categoryName: data.categoryName || "",
              categorySlug: data.categorySlug || "",
              subCategorySlug: data.subCategorySlug || "",
              categories: Array.isArray(data.categories) ? data.categories : [],
              courseName: data.courseName || data.course || "",
              admissionName:
                data.admissionName ||
                data.programName ||
                data.programmeName ||
                "",
              department: data.department || "",
              institute: data.institute || data.institution || "",
              organization: data.organization || "",
              startDateDisplay:
                data.startDateDisplay ||
                data.applicationStartDateDisplay ||
                "",
              startDate:
                data.startDate ||
                data.applicationStartDate ||
                data.admissionStartDate ||
                data.onlineApplyStartDate ||
                data.applyStartDate ||
                data.openingDate ||
                "",
              applicationStartDate: data.applicationStartDate || "",
              applicationStartDateDisplay:
                data.applicationStartDateDisplay || "",
              admissionStartDate: data.admissionStartDate || "",
              onlineApplyStartDate: data.onlineApplyStartDate || "",
              applyStartDate: data.applyStartDate || "",
              openingDate: data.openingDate || "",
              lastDateDisplay: data.lastDateDisplay || "",
              lastDate:
                data.lastDate ||
                data.applicationLastDate ||
                data.admissionLastDate ||
                data.applicationEndDate ||
                data.closingDate ||
                data.endDate ||
                "",
              applicationLastDate: data.applicationLastDate || "",
              admissionLastDate: data.admissionLastDate || "",
              applicationEndDate: data.applicationEndDate || "",
              closingDate: data.closingDate || "",
              endDate: data.endDate || "",
              publishedDate: data.publishedDate || "",
              importantDates: data.importantDates || [],
              published: data.published,
              createdAt: data.createdAt || null,
              sourceCollection: collectionName,
            });
          });
        }

        const validAdmissions = Array.from(
          new Map(
            allAdmissions
              .filter((item) => isAdmissionPost(item) && item.published !== false)
              .map((item) => [getAdmissionKey(item), item])
          ).values()
        );

        const discoveredCategories = Array.from(
          new Map(
            validAdmissions
              .flatMap((item) => getCategoryValues(item))
              .filter(Boolean)
              .map((item) => [normalizeCategoryKey(item), item])
          ).values()
        ).sort((a, b) => a.localeCompare(b));

        const filteredAdmissions = validAdmissions
          .filter((item) => matchesSelectedSubCategory(item, subCategoryName))
          .sort((a, b) => getTimeValue(b) - getTimeValue(a));

        setAvailableCategories(discoveredCategories);
        setAdmissions(filteredAdmissions);
        setVisibleCount(POSTS_PER_PAGE);
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
    <main className="os-category-page">
      <div className="os-category-container">
        <section className="os-category-top">
          <Link href="/admissions" className="os-back-link">
            ← Back to Admissions
          </Link>

          <p>ODISHA SATHI ADMISSIONS</p>
          <h1>{subCategoryName}</h1>
          <span>Latest admissions listed under {subCategoryName}.</span>
        </section>

        <section className="os-category-layout">
          <div className="os-category-main">
            <section className="os-list-section">
              <div className="os-list-section-head">
                <h2>Latest {subCategoryName}</h2>
              </div>

              {loading ? (
                <p className="os-list-status">Loading admissions...</p>
              ) : latestAdmissions.length === 0 ? (
                <p className="os-list-status">
                  No latest admissions found in this category.
                </p>
              ) : (
                <div className="os-admission-stack-grid">
                  {latestAdmissions.map((admission, index) => (
                    <LatestAdmissionStack
                      key={admission.id}
                      admission={admission}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="os-list-section">
              <div className="os-list-section-head">
                <h2>All {subCategoryName}</h2>
              </div>

              {loading ? (
                <p className="os-list-status">Loading admissions...</p>
              ) : admissions.length === 0 ? (
                <p className="os-list-status">
                  No admissions found in this category.
                </p>
              ) : (
                <>
                  <div className="os-category-admission-list">
                    {visibleAdmissions.map((admission) => (
                      <CategoryAdmissionItem
                        key={admission.id}
                        admission={admission}
                      />
                    ))}
                  </div>

                  {canViewMore ? (
                    <div className="os-view-more-wrap">
                      <button
                        type="button"
                        className="os-view-more-btn"
                        onClick={() =>
                          setVisibleCount((current) => current + POSTS_PER_PAGE)
                        }
                      >
                        View More
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </section>
          </div>

          <aside className="os-category-sidebar">
            <section className="os-side-card">
              <h2>Admission Categories</h2>

              <div className="os-side-category-list">
                {sideCategories.map((item) => (
                  <Link
                    key={item}
                    href={`/admissions/${encodeURIComponent(item)}`}
                    className={
                      normalizeCategoryKey(item) ===
                      normalizeCategoryKey(subCategoryName)
                        ? "os-active-category"
                        : ""
                    }
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </section>

            <section className="os-side-card">
              <h2>Quick Access</h2>

              <Link href="/jobs">Latest Jobs</Link>
              <Link href="/results">Results</Link>
              <Link href="/admissions">Admissions</Link>
              <Link href="/admit-cards">Admit Cards & Exams</Link>
              <Link href="/schemes">Schemes</Link>
              <Link href="/tools">Tools</Link>
            </section>

            <section className="os-side-card os-reminder-card">
              <div className="os-reminder-head">
                <h2>Last Date Reminder</h2>

                <ReminderShareButtons
                  getShareText={() =>
                    buildReminderShareText(reminderAdmissions, window.location.origin)
                  }
                  disabled={loading || reminderAdmissions.length === 0}
                  label="Last Date Reminder"
                />
              </div>

              {loading ? (
                <p className="os-side-status">Loading reminders...</p>
              ) : reminderAdmissions.length === 0 ? (
                <p className="os-side-status">
                  No admission deadline in this category within the next 7 days.
                </p>
              ) : (
                <div className="os-reminder-list">
                  {reminderAdmissions.map((admission) => (
                    <ReminderItem key={admission.id} admission={admission} />
                  ))}
                </div>
              )}
            </section>
          </aside>
        </section>
      </div>

      <style jsx global>{`
        .os-category-page {
          min-height: 100vh;
          background: #ffffff;
          color: #0f172a;
        }

        .os-category-container {
          width: min(100% - 32px, 1180px);
          margin: 0 auto;
          padding: 22px 0 42px;
        }

        .os-category-top {
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid #e5e7eb;
        }

        .os-back-link {
          display: inline-flex;
          align-items: center;
          margin-bottom: 12px;
          color: #2563eb;
          text-decoration: none;
          font-size: 14px;
          line-height: 1.2;
          font-weight: 900;
        }

        .os-back-link:hover {
          color: #ea580c;
          text-decoration: underline;
        }

        .os-category-top p {
          margin: 0 0 8px;
          color: #c2410c;
          font-size: 13px;
          line-height: 1.35;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .os-category-top h1 {
          margin: 0;
          color: #0f172a;
          font-size: clamp(25px, 4vw, 38px);
          line-height: 1.12;
          font-weight: 950;
          letter-spacing: -0.045em;
        }

        .os-category-top span {
          display: block;
          margin-top: 8px;
          color: #64748b;
          font-size: 15px;
          line-height: 1.45;
          font-weight: 700;
        }

        .os-category-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 18px;
          align-items: start;
        }

        .os-category-main {
          display: grid;
          gap: 16px;
          min-width: 0;
        }

        .os-list-section,
        .os-side-card {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          background: #ffffff;
        }

        .os-list-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .os-list-section-head h2,
        .os-side-card h2 {
          margin: 0;
          color: #0f172a;
          font-size: 18px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: -0.025em;
        }

        .os-admission-stack-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          padding: 14px;
        }

        .os-admission-stack-card {
          min-height: 112px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 8px;
          padding: 14px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 10px;
          text-decoration: none;
          color: #0f172a;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease;
        }

        .os-admission-stack-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.09);
        }

        .os-admission-stack-card h3 {
          margin: 0;
          color: #0f172a;
          font-size: 14.5px;
          line-height: 1.3;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .os-admission-stack-card p {
          margin: 0;
          color: #1f2937;
          font-size: 13px;
          line-height: 1.35;
          font-weight: 800;
        }

        .os-admission-stack-date-row {
          display: grid;
          gap: 4px;
          margin-top: auto;
        }

        .os-admission-stack-date-row span {
          font-size: 12px;
          line-height: 1.2;
          font-weight: 900;
        }

        .os-admission-stack-start,
        .os-date-green {
          color: #166534;
        }

        .os-admission-stack-end,
        .os-date-red {
          color: #dc2626;
        }

        .os-admission-stack-color-0 {
          background: linear-gradient(135deg, #fff7ed, #fed7aa);
        }

        .os-admission-stack-color-1 {
          background: linear-gradient(135deg, #eff6ff, #bfdbfe);
        }

        .os-admission-stack-color-2 {
          background: linear-gradient(135deg, #ecfdf5, #86efac);
        }

        .os-admission-stack-color-3 {
          background: linear-gradient(135deg, #fff1f2, #fecdd3);
        }

        .os-admission-stack-color-4 {
          background: linear-gradient(135deg, #f5f3ff, #ddd6fe);
        }

        .os-admission-stack-color-5 {
          background: linear-gradient(135deg, #fefce8, #fde68a);
        }

        .os-admission-stack-color-6 {
          background: linear-gradient(135deg, #ecfeff, #a5f3fc);
        }

        .os-admission-stack-color-7 {
          background: linear-gradient(135deg, #fdf2f8, #fbcfe8);
        }

        .os-category-admission-list {
          display: grid;
          gap: 10px;
          padding: 14px;
        }

        .os-category-admission-item {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
          padding: 14px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #ffffff;
          color: inherit;
          text-decoration: none;
          transition:
            background 0.15s ease,
            border-color 0.15s ease,
            transform 0.15s ease;
        }

        .os-category-admission-item:hover {
          background: #fff7ed;
          border-color: #fed7aa;
          transform: translateY(-1px);
        }

        .os-category-admission-item h3 {
          margin: 0;
          color: #1d4ed8;
          font-size: 15px;
          line-height: 1.35;
          font-weight: 900;
          letter-spacing: -0.01em;
        }

        .os-category-admission-item:hover h3 {
          color: #ea580c;
        }

        .os-category-admission-item p {
          margin: 5px 0 0;
          color: #475569;
          font-size: 13px;
          line-height: 1.35;
          font-weight: 800;
        }

        .os-category-admission-date-grid {
          min-width: 180px;
          display: grid;
          gap: 5px;
          justify-items: end;
        }

        .os-category-admission-date-grid span {
          color: #64748b;
          font-size: 12px;
          line-height: 1.2;
          font-weight: 900;
          white-space: nowrap;
        }

        .os-list-status {
          margin: 0;
          padding: 14px 16px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 600;
        }

        .os-view-more-wrap {
          display: flex;
          justify-content: center;
          padding: 16px;
          border-top: 1px solid #f1f5f9;
          background: #ffffff;
        }

        .os-view-more-btn {
          min-width: 150px;
          min-height: 42px;
          padding: 10px 22px;
          border: none;
          border-radius: 999px;
          background: #0b63ce;
          color: #ffffff;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.18);
          transition:
            transform 0.18s ease,
            background 0.18s ease,
            box-shadow 0.18s ease;
        }

        .os-view-more-btn:hover {
          background: #e85d04;
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(232, 93, 4, 0.2);
        }

        .os-category-sidebar {
          display: grid;
          gap: 16px;
          position: sticky;
          top: 92px;
        }

        .os-side-card {
          padding: 15px;
        }

        .os-side-card h2 {
          margin-bottom: 12px;
          font-size: 17px;
        }

        .os-side-card a {
          display: block;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
          color: #1d4ed8;
          text-decoration: none;
          font-size: 14px;
          font-weight: 800;
          transition:
            color 0.15s ease,
            background 0.15s ease;
        }

        .os-side-card a:last-child {
          border-bottom: none;
        }

        .os-side-card a:hover {
          color: #ea580c;
          text-decoration: underline;
        }

        .os-side-category-list {
          display: grid;
        }

        .os-side-category-list a {
          border-radius: 10px;
          padding: 10px 8px;
        }

        .os-side-category-list a:hover,
        .os-side-category-list a.os-active-category {
          background: #fff7ed;
          color: #ea580c;
          text-decoration: none;
        }

        .os-reminder-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .os-reminder-head h2 {
          margin: 0;
          color: #dc2626;
        }

        .os-whatsapp-share-btn {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 999px;
          background: #25d366;
          color: #ffffff;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(37, 211, 102, 0.24);
          transition:
            transform 0.18s ease,
            opacity 0.18s ease,
            box-shadow 0.18s ease;
        }

        .os-whatsapp-share-btn svg {
          width: 21px;
          height: 21px;
          fill: currentColor;
        }

        .os-whatsapp-share-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(37, 211, 102, 0.32);
        }

        .os-whatsapp-share-btn:disabled {
          cursor: not-allowed;
          opacity: 0.45;
          box-shadow: none;
        }

        .os-whatsapp-share-btn:disabled:hover {
          transform: none;
        }

        .os-side-status {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 600;
        }

        .os-reminder-list {
          display: grid;
          gap: 8px;
        }

        .os-reminder-item {
          display: grid !important;
          gap: 4px;
          padding: 9px 8px !important;
          border: 1px solid #fee2e2 !important;
          border-radius: 10px;
          background: #fff7f7;
          text-decoration: none !important;
        }

        .os-reminder-item span {
          color: #1d4ed8;
          font-size: 13px;
          line-height: 1.35;
          font-weight: 900;
        }

        .os-reminder-item strong {
          color: #dc2626;
          font-size: 12px;
          line-height: 1.2;
          font-weight: 900;
        }

        .os-reminder-item:hover {
          background: #fff1f2 !important;
        }

        .os-reminder-item:hover span {
          color: #ea580c;
        }

        @media (max-width: 1000px) {
          .os-admission-stack-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .os-category-admission-item {
            grid-template-columns: 1fr;
          }

          .os-category-admission-date-grid {
            min-width: 0;
            justify-items: start;
          }
        }

        @media (max-width: 900px) {
          .os-category-container {
            width: min(100% - 24px, 1180px);
            padding-top: 18px;
          }

          .os-category-top p {
            font-size: 12px;
          }

          .os-category-layout {
            grid-template-columns: 1fr;
          }

          .os-category-sidebar {
            position: static;
          }

          .os-list-section-head {
            padding: 13px 14px;
          }

          .os-view-more-wrap {
            padding: 14px;
          }

          .os-view-more-btn {
            width: 100%;
          }
        }

        @media (max-width: 620px) {
          .os-admission-stack-grid {
            grid-template-columns: 1fr;
            padding: 12px;
          }

          .os-admission-stack-card {
            min-height: 104px;
          }

          .os-category-admission-list {
            padding: 12px;
          }

          .os-category-admission-date-grid span {
            white-space: normal;
          }
        }
      `}</style>
    </main>
  );
}
