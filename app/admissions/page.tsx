"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import ReminderShareButtons from "@/components/public/ReminderShareButtons";

const ADMISSION_SUB_CATEGORIES = [
  "+2 Admissions",
  "+3 Admissions",
  "ITI Admissions",
  "Diploma Admissions",
  "Nursing Admissions",
  "B.Ed Admissions",
  "University Admissions",
  "Entrance Admissions",
  "Other Admissions",
];

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
  programmeName?: string;
  programName?: string;
  className?: string;
  department?: string;
  organization?: string;
  startDate?: string;
  admissionStartDate?: string;
  applicationStartDate?: string;
  applicationStartDateDisplay?: string;
  startDateDisplay?: string;
  openingDate?: string;
  lastDate?: string;
  admissionLastDate?: string;
  applicationLastDate?: string;
  lastDateDisplay?: string;
  applicationEndDate?: string;
  closingDate?: string;
  endDate?: string;
  importantDates?: ImportantDate[];
  createdAt?: any;
};

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

  if (Number.isNaN(date.getTime())) return null;

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

function getRawStartDate(item: AdmissionPost) {
  const directDate =
    item.startDateDisplay ||
    item.applicationStartDateDisplay ||
    item.startDate ||
    item.admissionStartDate ||
    item.applicationStartDate ||
    item.openingDate ||
    "";

  if (directDate) return directDate;

  const matchedDate = item.importantDates?.find((dateItem) => {
    const label = (dateItem.label || "").toLowerCase();

    return (
      label.includes("start") ||
      label.includes("opening") ||
      label.includes("begin")
    );
  });

  return matchedDate?.value || "";
}

function getRawLastDate(item: AdmissionPost) {
  const directDate =
    item.lastDateDisplay ||
    item.lastDate ||
    item.admissionLastDate ||
    item.applicationLastDate ||
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
      label.includes("end")
    );
  });

  return matchedDate?.value || "";
}

function getPublishedDate(item: AdmissionPost) {
  return formatDate(item.createdAt);
}

function getStartDate(item: AdmissionPost) {
  return formatDate(getRawStartDate(item));
}

function getLastDate(item: AdmissionPost) {
  return formatDate(getRawLastDate(item));
}

function getAdmissionName(item: AdmissionPost) {
  return (
    item.courseName ||
    item.admissionName ||
    item.programmeName ||
    item.programName ||
    item.className ||
    item.department ||
    item.organization ||
    "Admission details available"
  );
}

function isDeadlineWithinNext7Days(item: AdmissionPost) {
  const lastDate = parseDateValue(
    item.lastDate ||
      item.admissionLastDate ||
      item.applicationLastDate ||
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

function LatestAdmissionStack({
  admission,
  index,
}: {
  admission: AdmissionPost;
  index: number;
}) {
  const startDate = getStartDate(admission);
  const lastDate = getLastDate(admission);
  const admissionName = getAdmissionName(admission);

  return (
    <Link
      href={`/post/${admission.slug || admission.id}`}
      className={`os-admission-stack-card os-admission-stack-color-${index % 8}`}
    >
      <h3>{admission.title || "Untitled Admission"}</h3>

      <p>{admissionName}</p>

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

function AllAdmissionItem({ admission }: { admission: AdmissionPost }) {
  const publishedDate = getPublishedDate(admission);

  return (
    <Link
      href={`/post/${admission.slug || admission.id}`}
      className="os-all-admission-item"
    >
      <h3>{admission.title || "Untitled Admission"}</h3>

      {publishedDate ? (
        <span>Published: {publishedDate}</span>
      ) : (
        <span>Published date not available</span>
      )}
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

function buildReminderShareText(reminderAdmissions: AdmissionPost[], origin: string) {
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

function normalizeCategoryKey(value?: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/&/g, "and")
    .replace(/admissions/g, "admission")
    .replace(/[^a-z0-9]/g, "");
}

function getCategoryValues(item: AdmissionPost) {
  const values: string[] = [];

  if (item.subCategory) values.push(item.subCategory);
  if (item.admissionCategory) values.push(item.admissionCategory);
  if (item.categoryName) values.push(item.categoryName);

  if (Array.isArray(item.subCategories)) values.push(...item.subCategories);
  if (Array.isArray(item.admissionCategories)) {
    values.push(...item.admissionCategories);
  }
  if (Array.isArray(item.categories)) values.push(...item.categories);

  return values.filter(Boolean);
}

function getCanonicalAdmissionCategory(value: string) {
  const cleanValue = String(value || "").trim();
  const compactValue = cleanValue.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (
    compactValue.includes("plus2admission") ||
    compactValue.includes("plustwoadmission") ||
    compactValue === "2admission" ||
    compactValue === "2admissions"
  ) {
    return "+2 Admissions";
  }

  if (
    compactValue.includes("plus3admission") ||
    compactValue.includes("plusthreeadmission") ||
    compactValue === "3admission" ||
    compactValue === "3admissions"
  ) {
    return "+3 Admissions";
  }

  const fixedCategory = ADMISSION_SUB_CATEGORIES.find(
    (item) => normalizeCategoryKey(item) === normalizeCategoryKey(cleanValue)
  );

  return fixedCategory || cleanValue;
}

export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState<AdmissionPost[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [loading, setLoading] = useState(true);

  const latestAdmissions = admissions.slice(0, LATEST_STACK_COUNT);
  const visibleAdmissions = admissions.slice(0, visibleCount);
  const canViewMore = visibleCount < admissions.length;

  const sideCategories = Array.from(
    new Map(
      [...ADMISSION_SUB_CATEGORIES, ...availableCategories]
        .filter(Boolean)
        .map(getCanonicalAdmissionCategory)
        .map((item) => [normalizeCategoryKey(item), item])
    ).values()
  );

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

        const snapshot = await getDocs(collection(db, "posts"));

        const admissionList: AdmissionPost[] = snapshot.docs
          .map((docItem) => {
            const data = docItem.data();

            return {
              id: docItem.id,
              title: data.title || "",
              slug: data.slug || "",
              content: data.content || data.description || "",
              category: data.category || "",
              subCategory: data.subCategory || "",
              subCategories: Array.isArray(data.subCategories)
                ? data.subCategories
                : data.subCategory
                ? [data.subCategory]
                : [],
              admissionCategory: data.admissionCategory || "",
              admissionCategories: Array.isArray(data.admissionCategories)
                ? data.admissionCategories
                : [],
              categoryName: data.categoryName || "",
              categorySlug: data.categorySlug || "",
              subCategorySlug: data.subCategorySlug || "",
              categories: Array.isArray(data.categories) ? data.categories : [],
              courseName:
                data.courseName ||
                data.course ||
                data.admissionCourse ||
                "",
              admissionName: data.admissionName || "",
              programmeName: data.programmeName || "",
              programName: data.programName || "",
              className: data.className || "",
              department: data.department || "",
              organization: data.organization || "",
              startDateDisplay:
                data.startDateDisplay ||
                data.applicationStartDateDisplay ||
                "",
              startDate:
                data.startDate ||
                data.admissionStartDate ||
                data.applicationStartDate ||
                data.openingDate ||
                "",
              admissionStartDate: data.admissionStartDate || "",
              applicationStartDate: data.applicationStartDate || "",
              applicationStartDateDisplay:
                data.applicationStartDateDisplay || "",
              openingDate: data.openingDate || "",
              lastDateDisplay: data.lastDateDisplay || "",
              lastDate:
                data.lastDate ||
                data.admissionLastDate ||
                data.applicationLastDate ||
                data.applicationEndDate ||
                data.closingDate ||
                data.endDate ||
                "",
              admissionLastDate: data.admissionLastDate || "",
              applicationLastDate: data.applicationLastDate || "",
              applicationEndDate: data.applicationEndDate || "",
              closingDate: data.closingDate || "",
              endDate: data.endDate || "",
              importantDates: data.importantDates || [],
              createdAt: data.createdAt || null,
            };
          })
          .filter((item) => item.category === "admissions")
          .sort((a, b) => getTimeValue(b) - getTimeValue(a));

        const discoveredCategories = Array.from(
          new Map(
            admissionList
              .flatMap((item) => getCategoryValues(item))
              .filter(Boolean)
              .map((item) => [normalizeCategoryKey(item), item])
          ).values()
        ).sort((a, b) => a.localeCompare(b));

        setAdmissions(admissionList);
        setAvailableCategories(discoveredCategories);
        setVisibleCount(POSTS_PER_PAGE);
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
    <main className="os-list-page">
      <div className="os-list-container">
        <section className="os-list-top">
          <h1>
            ODISHA SATHI ADMISSIONS  (Find all the admission updates in this
            page)
          </h1>
        </section>

        <section className="os-admissions-layout">
          <div className="os-admissions-main">
            <section className="os-list-section">
              <div className="os-list-section-head">
                <h2>Latest Admissions</h2>
              </div>

              {loading ? (
                <p className="os-list-status">Loading admissions...</p>
              ) : latestAdmissions.length === 0 ? (
                <p className="os-list-status">No admissions found.</p>
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
                <h2>All Admissions</h2>
              </div>

              {loading ? (
                <p className="os-list-status">Loading admissions...</p>
              ) : admissions.length === 0 ? (
                <p className="os-list-status">No admissions found.</p>
              ) : (
                <>
                  <div className="os-all-admission-grid">
                    {visibleAdmissions.map((admission) => (
                      <AllAdmissionItem
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

          <aside className="os-admissions-sidebar">
            <section className="os-side-card">
              <h2>Admission Categories</h2>

              <div className="os-side-category-list">
                {sideCategories.map((item) => (
                  <Link
                    key={item}
                    href={`/admissions/${encodeURIComponent(item)}`}
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
                  No admission deadline in the next 7 days.
                </p>
              ) : (
                <div className="os-reminder-list">
                  {reminderAdmissions.map((admission) => (
                    <ReminderItem
                      key={admission.id}
                      admission={admission}
                    />
                  ))}
                </div>
              )}
            </section>
          </aside>
        </section>
      </div>

      <style jsx global>{`
        .os-list-page {
          min-height: 100vh;
          background: #ffffff;
          color: #0f172a;
        }

        .os-list-container {
          width: min(100% - 32px, 1180px);
          margin: 0 auto;
          padding: 22px 0 42px;
        }

        .os-list-top {
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid #e5e7eb;
        }

        .os-list-top h1 {
          margin: 0;
          color: #c2410c;
          font-size: 13px;
          line-height: 1.35;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .os-admissions-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 18px;
          align-items: start;
        }

        .os-admissions-main {
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

        .os-admission-stack-start {
          color: #166534;
        }

        .os-admission-stack-end {
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

        .os-all-admission-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          border-top: 1px solid #f1f5f9;
        }

        .os-all-admission-item {
          min-height: 62px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          flex-direction: column;
          gap: 5px;
          padding: 12px 14px;
          text-decoration: none;
          color: inherit;
          background: #ffffff;
          border-right: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
          transition:
            background 0.15s ease,
            color 0.15s ease;
        }

        .os-all-admission-item:nth-child(2n) {
          border-right: none;
        }

        .os-all-admission-item:hover {
          background: #fff7ed;
        }

        .os-all-admission-item h3 {
          margin: 0;
          color: #1d4ed8;
          font-size: 14px;
          line-height: 1.35;
          font-weight: 900;
          letter-spacing: -0.01em;
        }

        .os-all-admission-item:hover h3 {
          color: #ea580c;
        }

        .os-all-admission-item span {
          color: #64748b;
          font-size: 12px;
          line-height: 1.2;
          font-weight: 800;
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

        .os-admissions-sidebar {
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

        .os-side-category-list a:hover {
          background: #fff7ed;
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
        }

        @media (max-width: 900px) {
          .os-list-container {
            width: min(100% - 24px, 1180px);
            padding-top: 18px;
          }

          .os-list-top h1 {
            font-size: 12px;
          }

          .os-admissions-layout {
            grid-template-columns: 1fr;
          }

          .os-admissions-sidebar {
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

          .os-all-admission-grid {
            grid-template-columns: 1fr;
          }

          .os-all-admission-item {
            border-right: none;
          }

          .os-admission-stack-card {
            min-height: 104px;
          }
        }
      `}</style>
    </main>
  );
}
