"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import ReminderShareButtons from "@/components/public/ReminderShareButtons";
import { buildLastDateReminderShareText } from "@/lib/reminderShare";

const JOB_SUB_CATEGORIES = [
  "Odisha Jobs",
  "Central Jobs",
  "Apprenticeship",
  "10th Jobs",
  "ITI Jobs",
  "Diploma Jobs",
  "+2 Jobs",
  "+3 Jobs",
  "Technical Graduate Jobs",
  "Post Graduate Jobs",
];

const POSTS_PER_PAGE = 30;
const LATEST_STACK_COUNT = 8;

type ImportantDate = {
  label?: string;
  value?: string;
};

type QuickInfoPanel = {
  organization?: string;
  department?: string;
  postName?: string;
  totalVacancy?: string;
  qualification?: string;
  ageLimit?: string;
  salary?: string;
};

type JobPost = {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  category?: string;
  subCategory?: string;
  subCategories?: string[];
  department?: string;
  organization?: string;
  postName?: string;
  postNames?: string[];
  startDate?: string;
  applicationStartDate?: string;
  applicationOpenDate?: string;
  openingDate?: string;
  lastDate?: string;
  applicationLastDate?: string;
  applicationEndDate?: string;
  closingDate?: string;
  endDate?: string;
  importantDates?: ImportantDate[];
  quickInfoPanels?: QuickInfoPanel[];
  createdAt?: any;
};

function getTimeValue(item: JobPost) {
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

function getRawStartDate(item: JobPost) {
  const directDate =
    item.startDate ||
    item.applicationStartDate ||
    item.applicationOpenDate ||
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

function getRawLastDate(item: JobPost) {
  const directDate =
    item.lastDate ||
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

function getPublishedDate(item: JobPost) {
  return formatDate(item.createdAt);
}

function getStartDate(item: JobPost) {
  return formatDate(getRawStartDate(item));
}

function getLastDate(item: JobPost) {
  return formatDate(getRawLastDate(item));
}

function getPostName(item: JobPost) {
  if (Array.isArray(item.postNames) && item.postNames.length > 0) {
    return item.postNames.filter(Boolean).join(", ");
  }

  if (item.postName) return item.postName;

  const quickInfoPostNames =
    item.quickInfoPanels
      ?.map((panel) => panel.postName)
      .filter(Boolean)
      .join(", ") || "";

  if (quickInfoPostNames) return quickInfoPostNames;

  return item.department || item.organization || "Post details available";
}

function isDeadlineWithinNext7Days(item: JobPost) {
  const lastDate = parseDateValue(getRawLastDate(item));

  if (!lastDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextSevenDays = new Date(today);
  nextSevenDays.setDate(today.getDate() + 7);

  return lastDate >= today && lastDate <= nextSevenDays;
}

function LatestJobStack({ job, index }: { job: JobPost; index: number }) {
  const startDate = getStartDate(job);
  const lastDate = getLastDate(job);
  const postName = getPostName(job);

  return (
    <Link
      href={`/post/${job.slug || job.id}`}
      className={`os-job-stack-card os-job-stack-color-${index % 8}`}
    >
      <h3>{job.title || "Untitled Job"}</h3>

      <p>{postName}</p>

      <div className="os-job-stack-date-row">
        {startDate ? (
          <span className="os-job-stack-start">Start Date - {startDate}</span>
        ) : null}

        {lastDate ? (
          <span className="os-job-stack-end">Last Date - {lastDate}</span>
        ) : null}
      </div>
    </Link>
  );
}

function AllJobItem({ job }: { job: JobPost }) {
  const publishedDate = getPublishedDate(job);

  return (
    <Link href={`/post/${job.slug || job.id}`} className="os-all-job-item">
      <h3>{job.title || "Untitled Job"}</h3>

      {publishedDate ? (
        <span>Published: {publishedDate}</span>
      ) : (
        <span>Published date not available</span>
      )}
    </Link>
  );
}

function ReminderItem({ job }: { job: JobPost }) {
  const lastDate = getLastDate(job);

  return (
    <Link href={`/post/${job.slug || job.id}`} className="os-reminder-item">
      <span>{job.title || "Untitled Job"}</span>
      {lastDate ? <strong>Last Date: {lastDate}</strong> : null}
    </Link>
  );
}

function buildReminderShareText(reminderJobs: JobPost[], origin: string) {
  return buildLastDateReminderShareText(
    reminderJobs.map((job) => ({
      title: job.title || "Untitled Job",
      category: "Job",
      lastDate: getLastDate(job) || "Date not available",
      url: `${origin}/post/${job.slug || job.id}`,
    }))
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [loading, setLoading] = useState(true);

  const latestJobs = jobs.slice(0, LATEST_STACK_COUNT);
  const visibleJobs = jobs.slice(0, visibleCount);
  const canViewMore = visibleCount < jobs.length;

  const reminderJobs = jobs
    .filter((job) => isDeadlineWithinNext7Days(job))
    .sort((a, b) => {
      const dateA = parseDateValue(getRawLastDate(a))?.getTime() || 0;
      const dateB = parseDateValue(getRawLastDate(b))?.getTime() || 0;

      return dateA - dateB;
    });

  const handleShareReminder = () => {
    if (reminderJobs.length === 0) return;

    const shareText = buildReminderShareText(
      reminderJobs,
      window.location.origin
    );

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);

        const snapshot = await getDocs(collection(db, "posts"));

        const jobList: JobPost[] = snapshot.docs
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
              department: data.department || "",
              organization: data.organization || "",
              postName: data.postName || data.jobPostName || data.post || "",
              postNames: Array.isArray(data.postNames) ? data.postNames : [],
              startDate:
                data.startDate ||
                data.applicationStartDate ||
                data.applicationOpenDate ||
                data.openingDate ||
                "",
              applicationStartDate: data.applicationStartDate || "",
              applicationOpenDate: data.applicationOpenDate || "",
              openingDate: data.openingDate || "",
              lastDate:
                data.lastDate ||
                data.applicationLastDate ||
                data.applicationEndDate ||
                data.closingDate ||
                data.endDate ||
                "",
              applicationLastDate: data.applicationLastDate || "",
              applicationEndDate: data.applicationEndDate || "",
              closingDate: data.closingDate || "",
              endDate: data.endDate || "",
              importantDates: data.importantDates || [],
              quickInfoPanels: Array.isArray(data.quickInfoPanels)
                ? data.quickInfoPanels
                : [],
              createdAt: data.createdAt || null,
            };
          })
          .filter((item) => item.category === "jobs")
          .sort((a, b) => getTimeValue(b) - getTimeValue(a));

        setJobs(jobList);
        setVisibleCount(POSTS_PER_PAGE);
      } catch (error) {
        console.error(error);
        alert("Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  return (
    <main className="os-list-page">
      <div className="os-list-container">
        <section className="os-list-top">
          <h1>ODISHA SATHI JOBS  (Find all the jobs updates in this page)</h1>
        </section>

        <section className="os-jobs-layout">
          <div className="os-jobs-main">
            <section className="os-list-section os-latest-stack-section">
              <div className="os-list-section-head">
                <h2>Latest Jobs</h2>
              </div>

              {loading ? (
                <p className="os-list-status">Loading jobs...</p>
              ) : latestJobs.length === 0 ? (
                <p className="os-list-status">No jobs found.</p>
              ) : (
                <div className="os-job-stack-grid">
                  {latestJobs.map((job, index) => (
                    <LatestJobStack key={job.id} job={job} index={index} />
                  ))}
                </div>
              )}
            </section>

            <section className="os-list-section">
              <div className="os-list-section-head">
                <h2>All Jobs</h2>
              </div>

              {loading ? (
                <p className="os-list-status">Loading jobs...</p>
              ) : jobs.length === 0 ? (
                <p className="os-list-status">No jobs found.</p>
              ) : (
                <>
                  <div className="os-all-job-grid">
                    {visibleJobs.map((job) => (
                      <AllJobItem key={job.id} job={job} />
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

          <aside className="os-jobs-sidebar">
            <section className="os-side-card">
              <h2>Job Categories</h2>

              <div className="os-side-category-list">
                {JOB_SUB_CATEGORIES.map((item) => (
                  <Link key={item} href={`/jobs/${encodeURIComponent(item)}`}>
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
                    buildReminderShareText(reminderJobs, window.location.origin)
                  }
                  disabled={loading || reminderJobs.length === 0}
                  label="Last Date Reminder"
                />
              </div>

              {loading ? (
                <p className="os-side-status">Loading reminders...</p>
              ) : reminderJobs.length === 0 ? (
                <p className="os-side-status">
                  No job deadline in the next 7 days.
                </p>
              ) : (
                <div className="os-reminder-list">
                  {reminderJobs.map((job) => (
                    <ReminderItem key={job.id} job={job} />
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

        .os-jobs-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 18px;
          align-items: start;
        }

        .os-jobs-main {
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

        .os-job-stack-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          padding: 14px;
        }

        .os-job-stack-card {
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

        .os-job-stack-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.09);
        }

        .os-job-stack-card h3 {
          margin: 0;
          color: #0f172a;
          font-size: 14.5px;
          line-height: 1.3;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .os-job-stack-card p {
          margin: 0;
          color: #1f2937;
          font-size: 13px;
          line-height: 1.35;
          font-weight: 800;
        }

        .os-job-stack-date-row {
          display: grid;
          gap: 4px;
          margin-top: auto;
        }

        .os-job-stack-date-row span {
          font-size: 12px;
          line-height: 1.2;
          font-weight: 900;
        }

        .os-job-stack-start {
          color: #166534;
        }

        .os-job-stack-end {
          color: #dc2626;
        }

        .os-job-stack-color-0 {
          background: linear-gradient(135deg, #fff7ed, #fed7aa);
        }

        .os-job-stack-color-1 {
          background: linear-gradient(135deg, #eff6ff, #bfdbfe);
        }

        .os-job-stack-color-2 {
          background: linear-gradient(135deg, #ecfdf5, #86efac);
        }

        .os-job-stack-color-3 {
          background: linear-gradient(135deg, #fff1f2, #fecdd3);
        }

        .os-job-stack-color-4 {
          background: linear-gradient(135deg, #f5f3ff, #ddd6fe);
        }

        .os-job-stack-color-5 {
          background: linear-gradient(135deg, #fefce8, #fde68a);
        }

        .os-job-stack-color-6 {
          background: linear-gradient(135deg, #ecfeff, #a5f3fc);
        }

        .os-job-stack-color-7 {
          background: linear-gradient(135deg, #fdf2f8, #fbcfe8);
        }

        .os-all-job-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          border-top: 1px solid #f1f5f9;
        }

        .os-all-job-item {
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

        .os-all-job-item:nth-child(2n) {
          border-right: none;
        }

        .os-all-job-item:hover {
          background: #fff7ed;
        }

        .os-all-job-item h3 {
          margin: 0;
          color: #1d4ed8;
          font-size: 14px;
          line-height: 1.35;
          font-weight: 900;
          letter-spacing: -0.01em;
        }

        .os-all-job-item:hover h3 {
          color: #ea580c;
        }

        .os-all-job-item span {
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

        .os-view-more-btn:active {
          transform: translateY(0);
          box-shadow: 0 6px 14px rgba(37, 99, 235, 0.16);
        }

        .os-jobs-sidebar {
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
          .os-job-stack-grid {
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

          .os-jobs-layout {
            grid-template-columns: 1fr;
          }

          .os-jobs-sidebar {
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
          .os-job-stack-grid {
            grid-template-columns: 1fr;
            padding: 12px;
          }

          .os-all-job-grid {
            grid-template-columns: 1fr;
          }

          .os-all-job-item {
            border-right: none;
          }

          .os-job-stack-card {
            min-height: 104px;
          }
        }
      `}</style>
    </main>
  );
}
