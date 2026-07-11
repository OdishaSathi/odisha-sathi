"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import ReminderShareButtons from "@/components/public/ReminderShareButtons";

const ADMIT_CARD_SUB_CATEGORIES = [
  { label: "Odisha Admit Cards & Exams", value: "Odisha Admit Cards" },
  { label: "Central Admit Cards & Exams", value: "Central Admit Cards" },
  { label: "Entrance Admit Cards & Exams", value: "Entrance Admit Cards" },
  { label: "Recruitment Admit Cards & Exams", value: "Recruitment Admit Cards" },
  { label: "Board Admit Cards & Exams", value: "Board Admit Cards" },
  { label: "University Admit Cards & Exams", value: "University Admit Cards" },
  { label: "School Admit Cards & Exams", value: "School Admit Cards" },
  { label: "Other Admit Cards & Exams", value: "Other Admit Cards" },
];

const POSTS_PER_PAGE = 30;
const LATEST_STACK_COUNT = 8;

type ImportantDate = {
  label?: string;
  value?: string;
};

type AdmitCardPost = {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  category?: string;
  subCategory?: string;
  subCategories?: string[];
  examName?: string;
  postName?: string;
  department?: string;
  organization?: string;
  admitCardDate?: string;
  admitCardDateDisplay?: string;
  admitCardReleaseDate?: string;
  hallTicketDate?: string;
  examDate?: string;
  examDateDisplay?: string;
  testDate?: string;
  importantDates?: ImportantDate[];
  createdAt?: any;
};

function getTimeValue(item: AdmitCardPost) {
  return item.createdAt?.seconds || 0;
}

function normalizeText(value?: any) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function hasAdmitCardText(value?: any) {
  const text = normalizeText(value);

  return (
    text.includes("admitcard") ||
    text.includes("admitcards") ||
    text.includes("hallticket") ||
    text.includes("halltickets")
  );
}

function isAdmitCardPost(item: AdmitCardPost) {
  if (hasAdmitCardText(item.category)) return true;
  if (hasAdmitCardText(item.subCategory)) return true;
  if (hasAdmitCardText(item.title)) return true;

  if (Array.isArray(item.subCategories)) {
    return item.subCategories.some((subCategoryItem) =>
      hasAdmitCardText(subCategoryItem)
    );
  }

  return false;
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

function getPublishedDate(item: AdmitCardPost) {
  return formatDate(item.createdAt);
}

function getRawAdmitCardDate(item: AdmitCardPost) {
  const directDate =
    item.admitCardDateDisplay ||
    item.admitCardDate ||
    item.admitCardReleaseDate ||
    item.hallTicketDate ||
    "";

  if (directDate) return directDate;

  const matchedDate = item.importantDates?.find((dateItem) => {
    const label = (dateItem.label || "").toLowerCase();

    return (
      label.includes("admit") ||
      label.includes("hall ticket") ||
      label.includes("release")
    );
  });

  return matchedDate?.value || "";
}

function getRawExamDate(item: AdmitCardPost) {
  const directDate = item.examDate || item.testDate || "";

  if (directDate) return directDate;

  const matchedDate = item.importantDates?.find((dateItem) => {
    const label = (dateItem.label || "").toLowerCase();

    return (
      label.includes("exam") ||
      label.includes("test") ||
      label.includes("written")
    );
  });

  return matchedDate?.value || "";
}

function getAdmitCardDate(item: AdmitCardPost) {
  return formatDate(getRawAdmitCardDate(item));
}

function getExamDate(item: AdmitCardPost) {
  return formatDate(getRawExamDate(item));
}

function getExamName(item: AdmitCardPost) {
  return (
    item.examName ||
    item.postName ||
    item.department ||
    item.organization ||
    "Exam details available"
  );
}

function isExamWithinNext7Days(item: AdmitCardPost) {
  const examDate = parseDateValue(getRawExamDate(item));

  if (!examDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextSevenDays = new Date(today);
  nextSevenDays.setDate(today.getDate() + 7);

  return examDate >= today && examDate <= nextSevenDays;
}

function mapAdmitCardDocument(
  docItem: any,
  collectionName: string
): AdmitCardPost {
  const data = docItem.data();

  return {
    id: docItem.id,
    title: data.title || "",
    slug: data.slug || "",
    content: data.content || data.description || "",
    category:
      data.category ||
      data.postCategory ||
      data.postType ||
      data.type ||
      data.section ||
      data.module ||
      collectionName ||
      "",
    subCategory:
      data.subCategory ||
      data.subcategory ||
      data.admitCardCategory ||
      data.categoryName ||
      "",
    subCategories: Array.isArray(data.subCategories)
      ? data.subCategories
      : Array.isArray(data.subcategories)
      ? data.subcategories
      : data.subCategory
      ? [data.subCategory]
      : [],
    examName: data.examName || data.exam || "",
    postName: data.postName || data.post || "",
    department: data.department || "",
    organization: data.organization || "",
    admitCardDateDisplay:
      data.admitCardDateDisplay ||
      data.admitCardDisplayDate ||
      data.displayAdmitCardDate ||
      "",
    admitCardDate:
      data.admitCardDate ||
      data.admitCardReleaseDate ||
      data.hallTicketDate ||
      data.releaseDate ||
      "",
    admitCardReleaseDate: data.admitCardReleaseDate || "",
    hallTicketDate: data.hallTicketDate || "",
    examDateDisplay:
      data.examDateDisplay ||
      data.examDisplayDate ||
      data.displayExamDate ||
      "",
    examDate: data.examDate || data.testDate || "",
    testDate: data.testDate || "",
    importantDates: data.importantDates || [],
    createdAt: data.createdAt || null,
  };
}

async function loadAdmitCardCollection(collectionName: string) {
  try {
    const snapshot = await getDocs(collection(db, collectionName));

    return snapshot.docs.map((docItem) =>
      mapAdmitCardDocument(docItem, collectionName)
    );
  } catch (error) {
    console.warn(`Could not load ${collectionName}`, error);
    return [];
  }
}

function LatestAdmitCardStack({
  admitCard,
  index,
}: {
  admitCard: AdmitCardPost;
  index: number;
}) {
  const admitCardDate = getAdmitCardDate(admitCard);
  const examDate = getExamDate(admitCard);
  const examName = getExamName(admitCard);

  return (
    <Link
      href={`/post/${admitCard.slug || admitCard.id}`}
      className={`os-admit-stack-card os-admit-stack-color-${index % 8}`}
    >
      <h3>{admitCard.title || "Untitled Admit Card & Exam"}</h3>

      <p>{examName}</p>

      <div className="os-admit-stack-date-row">
        {admitCardDate ? (
          <span className="os-admit-stack-release">
            Admit Card Date - {admitCardDate}
          </span>
        ) : null}

        {examDate ? (
          <span className="os-admit-stack-exam">Exam Date - {examDate}</span>
        ) : null}
      </div>
    </Link>
  );
}

function AllAdmitCardItem({ admitCard }: { admitCard: AdmitCardPost }) {
  const publishedDate = getPublishedDate(admitCard);

  return (
    <Link
      href={`/post/${admitCard.slug || admitCard.id}`}
      className="os-all-admit-item"
    >
      <h3>{admitCard.title || "Untitled Admit Card & Exam"}</h3>

      {publishedDate ? (
        <span>Published: {publishedDate}</span>
      ) : (
        <span>Published date not available</span>
      )}
    </Link>
  );
}

function ReminderItem({ admitCard }: { admitCard: AdmitCardPost }) {
  const examDate = getExamDate(admitCard);

  return (
    <Link
      href={`/post/${admitCard.slug || admitCard.id}`}
      className="os-reminder-item"
    >
      <span>{admitCard.title || "Untitled Admit Card & Exam"}</span>
      {examDate ? <strong>Exam Date: {examDate}</strong> : null}
    </Link>
  );
}

function buildExamReminderShareText(
  reminderAdmitCards: AdmitCardPost[],
  origin: string
) {
  const lines: string[] = [
    "Odisha Sathi Exam Date and Admit Card Reminder",
    "",
  ];

  reminderAdmitCards.forEach((admitCard, index) => {
    const title = admitCard.title || "Untitled Admit Card & Exam";
    const examDate = getExamDate(admitCard) || "Date not available";
    const postLink = `${origin}/post/${admitCard.slug || admitCard.id}`;

    lines.push(title);
    lines.push(`Exam Date: ${examDate}`);
    lines.push(postLink);

    if (index < reminderAdmitCards.length - 1) {
      lines.push("");
    }
  });

  return lines.join("\n");
}

export default function AdmitCardsPage() {
  const [admitCards, setAdmitCards] = useState<AdmitCardPost[]>([]);
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [loading, setLoading] = useState(true);

  const latestAdmitCards = admitCards.slice(0, LATEST_STACK_COUNT);
  const visibleAdmitCards = admitCards.slice(0, visibleCount);
  const canViewMore = visibleCount < admitCards.length;

  const reminderAdmitCards = admitCards
    .filter((admitCard) => isExamWithinNext7Days(admitCard))
    .sort((a, b) => {
      const dateA = parseDateValue(getRawExamDate(a))?.getTime() || 0;
      const dateB = parseDateValue(getRawExamDate(b))?.getTime() || 0;

      return dateA - dateB;
    });

  const handleShareReminder = () => {
    if (reminderAdmitCards.length === 0) return;

    const shareText = buildExamReminderShareText(
      reminderAdmitCards,
      window.location.origin
    );

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    const loadAdmitCards = async () => {
      try {
        setLoading(true);

        const collectionNames = [
          "posts",
          "admitCards",
          "admit-cards",
          "admitcards",
        ];

        const loadedGroups = await Promise.all(
          collectionNames.map((collectionName) =>
            loadAdmitCardCollection(collectionName)
          )
        );

        const combinedList = loadedGroups.flat();

        const uniqueMap = new Map<string, AdmitCardPost>();

        combinedList
          .filter((item) => isAdmitCardPost(item))
          .forEach((item) => {
            const uniqueKey = item.slug || item.id;

            if (!uniqueMap.has(uniqueKey)) {
              uniqueMap.set(uniqueKey, item);
            }
          });

        const admitCardList = Array.from(uniqueMap.values()).sort(
          (a, b) => getTimeValue(b) - getTimeValue(a)
        );

        setAdmitCards(admitCardList);
        setVisibleCount(POSTS_PER_PAGE);
      } catch (error) {
        console.error(error);
        alert("Failed to load admit cards and exams");
      } finally {
        setLoading(false);
      }
    };

    loadAdmitCards();
  }, []);

  return (
    <main className="os-list-page">
      <div className="os-list-container">
        <section className="os-list-top">
          <p>
            ODISHA SATHI ADMIT CARDS & EXAMS  (Find all the admit card and exam
            updates in this page)
          </p>
        </section>

        <section className="os-admit-layout">
          <div className="os-admit-main">
            <section className="os-list-section">
              <div className="os-list-section-head">
                <h2>Latest Admit Cards & Exams</h2>
              </div>

              {loading ? (
                <p className="os-list-status">
                  Loading admit cards and exams...
                </p>
              ) : latestAdmitCards.length === 0 ? (
                <p className="os-list-status">
                  No admit cards and exams found.
                </p>
              ) : (
                <div className="os-admit-stack-grid">
                  {latestAdmitCards.map((admitCard, index) => (
                    <LatestAdmitCardStack
                      key={admitCard.id}
                      admitCard={admitCard}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="os-list-section">
              <div className="os-list-section-head">
                <h2>All Admit Cards & Exams</h2>
              </div>

              {loading ? (
                <p className="os-list-status">
                  Loading admit cards and exams...
                </p>
              ) : admitCards.length === 0 ? (
                <p className="os-list-status">
                  No admit cards and exams found.
                </p>
              ) : (
                <>
                  <div className="os-all-admit-grid">
                    {visibleAdmitCards.map((admitCard) => (
                      <AllAdmitCardItem
                        key={admitCard.id}
                        admitCard={admitCard}
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

          <aside className="os-admit-sidebar">
            <section className="os-side-card">
              <h2>Admit Cards & Exams Categories</h2>

              <div className="os-side-category-list">
                {ADMIT_CARD_SUB_CATEGORIES.map((item) => (
                  <Link
                    key={item.value}
                    href={`/admit-cards/${encodeURIComponent(item.value)}`}
                  >
                    {item.label}
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
                <h2>Exam Date and Admit Card Reminder</h2>

                <ReminderShareButtons
                  getShareText={() =>
                    buildExamReminderShareText(reminderAdmitCards, window.location.origin)
                  }
                  disabled={loading || reminderAdmitCards.length === 0}
                  label="Exam Date and Admit Card Reminder"
                />
              </div>

              {loading ? (
                <p className="os-side-status">Loading reminders...</p>
              ) : reminderAdmitCards.length === 0 ? (
                <p className="os-side-status">
                  No exam date in the next 7 days.
                </p>
              ) : (
                <div className="os-reminder-list">
                  {reminderAdmitCards.map((admitCard) => (
                    <ReminderItem
                      key={admitCard.id}
                      admitCard={admitCard}
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

        .os-list-top p {
          margin: 0;
          color: #c2410c;
          font-size: 13px;
          line-height: 1.35;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .os-admit-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 18px;
          align-items: start;
        }

        .os-admit-main {
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

        .os-admit-stack-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          padding: 14px;
        }

        .os-admit-stack-card {
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

        .os-admit-stack-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.09);
        }

        .os-admit-stack-card h3 {
          margin: 0;
          color: #0f172a;
          font-size: 14.5px;
          line-height: 1.3;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .os-admit-stack-card p {
          margin: 0;
          color: #1f2937;
          font-size: 13px;
          line-height: 1.35;
          font-weight: 800;
        }

        .os-admit-stack-date-row {
          display: grid;
          gap: 4px;
          margin-top: auto;
        }

        .os-admit-stack-date-row span {
          font-size: 12px;
          line-height: 1.2;
          font-weight: 900;
        }

        .os-admit-stack-release {
          color: #166534;
        }

        .os-admit-stack-exam {
          color: #dc2626;
        }

        .os-admit-stack-color-0 {
          background: linear-gradient(135deg, #fff7ed, #fed7aa);
        }

        .os-admit-stack-color-1 {
          background: linear-gradient(135deg, #eff6ff, #bfdbfe);
        }

        .os-admit-stack-color-2 {
          background: linear-gradient(135deg, #ecfdf5, #86efac);
        }

        .os-admit-stack-color-3 {
          background: linear-gradient(135deg, #fff1f2, #fecdd3);
        }

        .os-admit-stack-color-4 {
          background: linear-gradient(135deg, #f5f3ff, #ddd6fe);
        }

        .os-admit-stack-color-5 {
          background: linear-gradient(135deg, #fefce8, #fde68a);
        }

        .os-admit-stack-color-6 {
          background: linear-gradient(135deg, #ecfeff, #a5f3fc);
        }

        .os-admit-stack-color-7 {
          background: linear-gradient(135deg, #fdf2f8, #fbcfe8);
        }

        .os-all-admit-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          border-top: 1px solid #f1f5f9;
        }

        .os-all-admit-item {
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

        .os-all-admit-item:nth-child(2n) {
          border-right: none;
        }

        .os-all-admit-item:hover {
          background: #fff7ed;
        }

        .os-all-admit-item h3 {
          margin: 0;
          color: #1d4ed8;
          font-size: 14px;
          line-height: 1.35;
          font-weight: 900;
          letter-spacing: -0.01em;
        }

        .os-all-admit-item:hover h3 {
          color: #ea580c;
        }

        .os-all-admit-item span {
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

        .os-admit-sidebar {
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
          .os-admit-stack-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .os-list-container {
            width: min(100% - 24px, 1180px);
            padding-top: 18px;
          }

          .os-list-top p {
            font-size: 12px;
          }

          .os-admit-layout {
            grid-template-columns: 1fr;
          }

          .os-admit-sidebar {
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
          .os-admit-stack-grid {
            grid-template-columns: 1fr;
            padding: 12px;
          }

          .os-all-admit-grid {
            grid-template-columns: 1fr;
          }

          .os-all-admit-item {
            border-right: none;
          }

          .os-admit-stack-card {
            min-height: 104px;
          }
        }
      `}</style>
    </main>
  );
}