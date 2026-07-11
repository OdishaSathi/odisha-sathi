"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import ReminderShareButtons from "@/components/public/ReminderShareButtons";

const ADMIT_CARD_SUB_CATEGORIES = [
  { label: "Odisha Admit Cards & Exams", value: "Odisha Admit Cards" },
  { label: "Central Admit Cards & Exams", value: "Central Admit Cards" },
  { label: "Board Admit Cards & Exams", value: "Board Admit Cards" },
  { label: "University Admit Cards & Exams", value: "University Admit Cards" },
  { label: "Entrance Admit Cards & Exams", value: "Entrance Admit Cards" },
  { label: "Recruitment Admit Cards & Exams", value: "Recruitment Admit Cards" },
  { label: "10th Admit Cards & Exams", value: "10th Admit Cards" },
  { label: "+2 Admit Cards & Exams", value: "+2 Admit Cards" },
  { label: "+3 Admit Cards & Exams", value: "+3 Admit Cards" },
  { label: "Other Admit Cards & Exams", value: "Other Admit Cards" },
];

const ADMIT_CARD_COLLECTIONS = [
  "posts",
  "admitCards",
  "admit-cards",
  "admitcards",
];

const POSTS_PER_PAGE = 30;
const LATEST_STACK_COUNT = 8;

type ImportantDate = {
  label?: string;
  value?: string;
};

type CategoryOption = {
  label: string;
  value: string;
};

type AdmitCardPost = {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  description?: string;
  category?: string;
  subCategory?: string;
  subCategories?: string[];
  admitCardCategory?: string;
  admitCardCategories?: string[];
  examCategory?: string;
  examCategories?: string[];
  categoryName?: string;
  categorySlug?: string;
  subCategorySlug?: string;
  categories?: string[];
  examName?: string;
  postName?: string;
  organization?: string;
  department?: string;
  admitCardDate?: string;
  admitCardDateDisplay?: string;
  admitCardReleaseDate?: string;
  admitCardDownloadDate?: string;
  hallTicketDate?: string;
  examDate?: string;
  examDateDisplay?: string;
  examinationDate?: string;
  testDate?: string;
  writtenExamDate?: string;
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
    .replace(/&/g, " ")
    .replace(/admitcards/g, " ")
    .replace(/admitcard/g, " ")
    .replace(/hallticket/g, " ")
    .replace(/admit/g, " ")
    .replace(/cards/g, " ")
    .replace(/card/g, " ")
    .replace(/exams/g, " ")
    .replace(/exam/g, " ")
    .replace(/notifications/g, " ")
    .replace(/notification/g, " ")
    .replace(/\band\b/g, " ")
    .replace(/[^a-z0-9]/g, "");
}

function getDisplayCategoryName(value?: string) {
  const text = (value || "").trim();

  if (!text) return "Admit Cards & Exams";

  return text
    .replace(/admit cards\s*&\s*exams/gi, "Admit Cards & Exams")
    .replace(/admit card\s*&\s*exam/gi, "Admit Cards & Exams")
    .replace(/admit cards/gi, "Admit Cards & Exams")
    .replace(/admit card/gi, "Admit Cards & Exams")
    .replace(/\bexams\b/gi, "Admit Cards & Exams")
    .replace(/\bexam\b/gi, "Admit Cards & Exams");
}

function getSearchText(item: AdmitCardPost) {
  return normalizeCategoryKey(
    [
      item.title,
      item.content,
      item.description,
      item.examName,
      item.postName,
      item.organization,
      item.department,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function getTimeValue(item: AdmitCardPost) {
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

function getPublishedDate(item: AdmitCardPost) {
  return formatDate(item.createdAt || item.publishedDate);
}

function getRawAdmitCardDate(item: AdmitCardPost) {
  const directDate =
    item.admitCardDateDisplay ||
    item.admitCardDate ||
    item.admitCardReleaseDate ||
    item.admitCardDownloadDate ||
    item.hallTicketDate ||
    "";

  if (directDate) return directDate;

  const matchedDate = item.importantDates?.find((dateItem) => {
    const label = (dateItem.label || "").toLowerCase();

    return (
      label.includes("admit") ||
      label.includes("hall ticket") ||
      label.includes("download")
    );
  });

  return matchedDate?.value || "";
}

function getRawExamDate(item: AdmitCardPost) {
  const directDate =
    item.examDateDisplay ||
    item.examDate ||
    item.examinationDate ||
    item.testDate ||
    item.writtenExamDate ||
    "";

  if (directDate) return directDate;

  const matchedDate = item.importantDates?.find((dateItem) => {
    const label = (dateItem.label || "").toLowerCase();

    return (
      label.includes("exam") ||
      label.includes("examination") ||
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

function getAdmitCardMeta(item: AdmitCardPost) {
  return (
    item.examName ||
    item.postName ||
    item.organization ||
    item.department ||
    item.admitCardCategory ||
    item.examCategory ||
    "Admit card and exam details available"
  );
}

function isAdmitCardPost(item: AdmitCardPost) {
  const category = normalizeText(item.category);
  const sourceCollection = normalizeText(item.sourceCollection);

  return (
    sourceCollection === "admitcards" ||
    sourceCollection === "admit-cards" ||
    category === "admit-cards" ||
    category === "admitcards" ||
    category === "admit card" ||
    category === "admit cards" ||
    category === "exam" ||
    category === "exams"
  );
}

function getCategoryValues(item: AdmitCardPost) {
  const values: string[] = [];

  if (item.subCategory) values.push(item.subCategory);
  if (item.admitCardCategory) values.push(item.admitCardCategory);
  if (item.examCategory) values.push(item.examCategory);
  if (item.categoryName) values.push(item.categoryName);
  if (item.categorySlug) values.push(item.categorySlug);
  if (item.subCategorySlug) values.push(item.subCategorySlug);

  if (Array.isArray(item.subCategories)) {
    values.push(...item.subCategories.filter(Boolean));
  }

  if (Array.isArray(item.admitCardCategories)) {
    values.push(...item.admitCardCategories.filter(Boolean));
  }

  if (Array.isArray(item.examCategories)) {
    values.push(...item.examCategories.filter(Boolean));
  }

  if (Array.isArray(item.categories)) {
    values.push(...item.categories.filter(Boolean));
  }

  return values.filter(Boolean);
}

function getSavedCategoryKeys(item: AdmitCardPost) {
  return Array.from(
    new Set(
      getCategoryValues(item)
        .map((value) => normalizeCategoryKey(value))
        .filter(Boolean)
    )
  );
}

function inferCategoryKeysFromText(item: AdmitCardPost) {
  const searchText = getSearchText(item);
  const inferredKeys = new Set<string>();

  if (!searchText) return inferredKeys;

  const hasPlus2 =
    searchText.includes("plus2") ||
    searchText.includes("12th") ||
    searchText.includes("hse") ||
    searchText.includes("highersecondary") ||
    searchText.includes("class12");

  const hasPlus3 =
    searchText.includes("plus3") ||
    searchText.includes("degree") ||
    searchText.includes("ug") ||
    searchText.includes("undergraduate") ||
    searchText.includes("graduation");

  const has10th =
    searchText.includes("10th") ||
    searchText.includes("matric") ||
    searchText.includes("class10");

  const hasEntrance =
    searchText.includes("entrance") ||
    searchText.includes("ojee") ||
    searchText.includes("jee") ||
    searchText.includes("neet") ||
    searchText.includes("cuet") ||
    searchText.includes("ouat");

  const hasRecruitment =
    searchText.includes("recruitment") ||
    searchText.includes("ssc") ||
    searchText.includes("rrb") ||
    searchText.includes("railway") ||
    searchText.includes("opsc") ||
    searchText.includes("osssc") ||
    searchText.includes("bank") ||
    searchText.includes("apprentice") ||
    searchText.includes("post");

  const hasBoard =
    searchText.includes("board") ||
    searchText.includes("bse") ||
    searchText.includes("chse") ||
    searchText.includes("cbse");

  const hasUniversity =
    searchText.includes("university") ||
    searchText.includes("semester") ||
    searchText.includes("pg") ||
    searchText.includes("postgraduate") ||
    (hasPlus3 && !hasPlus2);

  const hasOdisha =
    searchText.includes("odisha") ||
    searchText.includes("otet") ||
    searchText.includes("osstet") ||
    searchText.includes("ojee") ||
    searchText.includes("ouat") ||
    searchText.includes("opsc") ||
    searchText.includes("osssc") ||
    searchText.includes("chse") ||
    searchText.includes("bse");

  const hasCentral =
    searchText.includes("central") ||
    searchText.includes("ssc") ||
    searchText.includes("rrb") ||
    searchText.includes("railway") ||
    searchText.includes("upsc") ||
    searchText.includes("ctet") ||
    searchText.includes("cbse") ||
    searchText.includes("neet") ||
    searchText.includes("jee");

  if (hasPlus2 && !hasPlus3) inferredKeys.add("plus2");
  if (hasPlus3 && !hasPlus2) inferredKeys.add("plus3");
  if (has10th && !hasPlus2 && !hasPlus3) inferredKeys.add("10th");

  if (hasOdisha) inferredKeys.add("odisha");
  if (hasCentral) inferredKeys.add("central");

  if (hasBoard && !hasRecruitment && !hasEntrance) inferredKeys.add("board");
  if (hasUniversity && !hasPlus2 && !has10th && !hasRecruitment) {
    inferredKeys.add("university");
  }
  if (hasEntrance && !hasRecruitment) inferredKeys.add("entrance");
  if (hasRecruitment) inferredKeys.add("recruitment");

  return inferredKeys;
}

function matchesSelectedSubCategory(
  item: AdmitCardPost,
  selectedSubCategory: string
) {
  const selectedKey = normalizeCategoryKey(selectedSubCategory);

  if (!selectedKey) return false;

  const savedCategoryKeys = getSavedCategoryKeys(item);

  if (savedCategoryKeys.length > 0) {
    if (selectedKey === "other") {
      return savedCategoryKeys.includes("other");
    }

    return savedCategoryKeys.includes(selectedKey);
  }

  const inferredKeys = inferCategoryKeysFromText(item);

  if (selectedKey === "other") {
    return inferredKeys.size === 0;
  }

  return inferredKeys.has(selectedKey);
}

function getReminderDateInfo(item: AdmitCardPost) {
  const examDate = parseDateValue(getRawExamDate(item));
  const admitCardDate = parseDateValue(getRawAdmitCardDate(item));

  if (examDate) {
    return {
      label: "Exam Date",
      rawDate: getRawExamDate(item),
      date: examDate,
    };
  }

  if (admitCardDate) {
    return {
      label: "Admit Card Date",
      rawDate: getRawAdmitCardDate(item),
      date: admitCardDate,
    };
  }

  return null;
}

function isReminderWithinNext7Days(item: AdmitCardPost) {
  const reminderInfo = getReminderDateInfo(item);

  if (!reminderInfo) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextSevenDays = new Date(today);
  nextSevenDays.setDate(today.getDate() + 7);

  return reminderInfo.date >= today && reminderInfo.date <= nextSevenDays;
}

function getAdmitCardKey(item: AdmitCardPost) {
  return item.slug || item.id;
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
  const metaText = getAdmitCardMeta(admitCard);

  return (
    <Link
      href={`/post/${admitCard.slug || admitCard.id}`}
      className={`os-admit-stack-card os-admit-stack-color-${index % 8}`}
    >
      <h3>{admitCard.title || "Untitled Admit Card & Exam"}</h3>

      <p>{metaText}</p>

      <div className="os-admit-stack-date-row">
        {admitCardDate ? (
          <span className="os-admit-stack-start">
            Admit Card Date - {admitCardDate}
          </span>
        ) : null}

        {examDate ? (
          <span className="os-admit-stack-end">Exam Date - {examDate}</span>
        ) : null}
      </div>
    </Link>
  );
}

function CategoryAdmitCardItem({ admitCard }: { admitCard: AdmitCardPost }) {
  const publishedDate = getPublishedDate(admitCard);
  const admitCardDate = getAdmitCardDate(admitCard);
  const examDate = getExamDate(admitCard);
  const metaText = getAdmitCardMeta(admitCard);

  return (
    <Link
      href={`/post/${admitCard.slug || admitCard.id}`}
      className="os-category-admit-item"
    >
      <div>
        <h3>{admitCard.title || "Untitled Admit Card & Exam"}</h3>
        <p>{metaText}</p>
      </div>

      <div className="os-category-admit-date-grid">
        {publishedDate ? <span>Published: {publishedDate}</span> : null}
        {admitCardDate ? (
          <span className="os-date-green">
            Admit Card Date: {admitCardDate}
          </span>
        ) : null}
        {examDate ? (
          <span className="os-date-red">Exam Date: {examDate}</span>
        ) : null}
      </div>
    </Link>
  );
}

function ReminderItem({ admitCard }: { admitCard: AdmitCardPost }) {
  const reminderInfo = getReminderDateInfo(admitCard);

  return (
    <Link
      href={`/post/${admitCard.slug || admitCard.id}`}
      className="os-reminder-item"
    >
      <span>{admitCard.title || "Untitled Admit Card & Exam"}</span>
      {reminderInfo ? (
        <strong>
          {reminderInfo.label}: {formatDate(reminderInfo.rawDate)}
        </strong>
      ) : null}
    </Link>
  );
}

function buildReminderShareText(
  reminderAdmitCards: AdmitCardPost[],
  origin: string
) {
  const lines: string[] = ["Odisha Sathi Exam Date and Admit Card Reminder", ""];

  reminderAdmitCards.forEach((admitCard, index) => {
    const title = admitCard.title || "Untitled Admit Card & Exam";
    const reminderInfo = getReminderDateInfo(admitCard);
    const dateLabel = reminderInfo?.label || "Date";
    const dateValue = reminderInfo
      ? formatDate(reminderInfo.rawDate)
      : "Date not available";
    const postLink = `${origin}/post/${admitCard.slug || admitCard.id}`;

    lines.push(title);
    lines.push(`${dateLabel}: ${dateValue}`);
    lines.push(postLink);

    if (index < reminderAdmitCards.length - 1) {
      lines.push("");
    }
  });

  return lines.join("\n");
}

export default function AdmitCardSubCategoryPage() {
  const params = useParams();

  const subCategoryName =
    getSafeParamValue(params.subCategory as string | string[] | undefined) ||
    getSafeParamValue(params.category as string | string[] | undefined);

  const displaySubCategoryName = getDisplayCategoryName(subCategoryName);

  const [admitCards, setAdmitCards] = useState<AdmitCardPost[]>([]);
  const [availableCategories, setAvailableCategories] = useState<
    CategoryOption[]
  >([]);
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [loading, setLoading] = useState(true);

  const latestAdmitCards = admitCards.slice(0, LATEST_STACK_COUNT);
  const visibleAdmitCards = admitCards.slice(0, visibleCount);
  const canViewMore = visibleCount < admitCards.length;

  const sideCategories = useMemo(() => {
    const combined = [...ADMIT_CARD_SUB_CATEGORIES, ...availableCategories];

    return Array.from(
      new Map(
        combined
          .filter((item) => item.value)
          .map((item) => [normalizeCategoryKey(item.value), item])
      ).values()
    );
  }, [availableCategories]);

  const reminderAdmitCards = admitCards
    .filter((admitCard) => isReminderWithinNext7Days(admitCard))
    .sort((a, b) => {
      const dateA = getReminderDateInfo(a)?.date.getTime() || 0;
      const dateB = getReminderDateInfo(b)?.date.getTime() || 0;

      return dateA - dateB;
    });

  const handleShareReminder = () => {
    if (reminderAdmitCards.length === 0) return;

    const shareText = buildReminderShareText(
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

        const allAdmitCards: AdmitCardPost[] = [];

        for (const collectionName of ADMIT_CARD_COLLECTIONS) {
          const snapshot = await getDocs(collection(db, collectionName));

          snapshot.docs.forEach((docItem) => {
            const data = docItem.data();

            allAdmitCards.push({
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
              admitCardCategory:
                data.admitCardCategory ||
                data.admitCardSubCategory ||
                data.selectedAdmitCardCategory ||
                "",
              admitCardCategories: Array.isArray(data.admitCardCategories)
                ? data.admitCardCategories
                : Array.isArray(data.selectedAdmitCardCategories)
                ? data.selectedAdmitCardCategories
                : [],
              examCategory:
                data.examCategory ||
                data.examSubCategory ||
                data.selectedExamCategory ||
                "",
              examCategories: Array.isArray(data.examCategories)
                ? data.examCategories
                : Array.isArray(data.selectedExamCategories)
                ? data.selectedExamCategories
                : [],
              categoryName: data.categoryName || "",
              categorySlug: data.categorySlug || "",
              subCategorySlug: data.subCategorySlug || "",
              categories: Array.isArray(data.categories) ? data.categories : [],
              examName: data.examName || data.exam || "",
              postName: data.postName || data.examPostName || data.post || "",
              organization: data.organization || "",
              department: data.department || "",
              admitCardDateDisplay:
                data.admitCardDateDisplay ||
                data.admitCardDisplayDate ||
                data.displayAdmitCardDate ||
                "",
              admitCardDate:
                data.admitCardDate ||
                data.admitCardReleaseDate ||
                data.admitCardDownloadDate ||
                data.hallTicketDate ||
                "",
              admitCardReleaseDate: data.admitCardReleaseDate || "",
              admitCardDownloadDate: data.admitCardDownloadDate || "",
              hallTicketDate: data.hallTicketDate || "",
              examDateDisplay:
                data.examDateDisplay ||
                data.examDisplayDate ||
                data.displayExamDate ||
                "",
              examDate:
                data.examDate ||
                data.examinationDate ||
                data.testDate ||
                data.writtenExamDate ||
                "",
              examinationDate: data.examinationDate || "",
              testDate: data.testDate || "",
              writtenExamDate: data.writtenExamDate || "",
              publishedDate: data.publishedDate || "",
              importantDates: data.importantDates || [],
              published: data.published,
              createdAt: data.createdAt || null,
              sourceCollection: collectionName,
            });
          });
        }

        const validAdmitCards = Array.from(
          new Map(
            allAdmitCards
              .filter((item) => isAdmitCardPost(item) && item.published !== false)
              .map((item) => [getAdmitCardKey(item), item])
          ).values()
        );

        const discoveredCategories = Array.from(
          new Map(
            validAdmitCards
              .flatMap((item) => getCategoryValues(item))
              .filter(Boolean)
              .map((item) => [
                normalizeCategoryKey(item),
                {
                  label: getDisplayCategoryName(item),
                  value: item,
                },
              ])
          ).values()
        ).sort((a, b) => a.label.localeCompare(b.label));

        const filteredAdmitCards = validAdmitCards
          .filter((item) => matchesSelectedSubCategory(item, subCategoryName))
          .sort((a, b) => getTimeValue(b) - getTimeValue(a));

        setAvailableCategories(discoveredCategories);
        setAdmitCards(filteredAdmitCards);
        setVisibleCount(POSTS_PER_PAGE);
      } catch (error) {
        console.error(error);
        alert("Failed to load admit cards and exams");
      } finally {
        setLoading(false);
      }
    };

    loadAdmitCards();
  }, [subCategoryName]);

  return (
    <main className="os-category-page">
      <div className="os-category-container">
        <section className="os-category-top">
          <Link href="/admit-cards" className="os-back-link">
            ← Back to Admit Cards & Exams
          </Link>

          <p>ODISHA SATHI ADMIT CARDS & EXAMS</p>
          <h1>{displaySubCategoryName}</h1>
          <span>
            Latest admit cards and exams listed under {displaySubCategoryName}.
          </span>
        </section>

        <section className="os-category-layout">
          <div className="os-category-main">
            <section className="os-list-section">
              <div className="os-list-section-head">
                <h2>Latest {displaySubCategoryName}</h2>
              </div>

              {loading ? (
                <p className="os-list-status">Loading admit cards and exams...</p>
              ) : latestAdmitCards.length === 0 ? (
                <p className="os-list-status">
                  No latest admit cards and exams found in this category.
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
                <h2>All {displaySubCategoryName}</h2>
              </div>

              {loading ? (
                <p className="os-list-status">Loading admit cards and exams...</p>
              ) : admitCards.length === 0 ? (
                <p className="os-list-status">
                  No admit cards and exams found in this category.
                </p>
              ) : (
                <>
                  <div className="os-category-admit-list">
                    {visibleAdmitCards.map((admitCard) => (
                      <CategoryAdmitCardItem
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

          <aside className="os-category-sidebar">
            <section className="os-side-card">
              <h2>Admit Cards & Exams Categories</h2>

              <div className="os-side-category-list">
                {sideCategories.map((item) => (
                  <Link
                    key={item.value}
                    href={`/admit-cards/${encodeURIComponent(item.value)}`}
                    className={
                      normalizeCategoryKey(item.value) ===
                      normalizeCategoryKey(subCategoryName)
                        ? "os-active-category"
                        : ""
                    }
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
                    buildReminderShareText(reminderAdmitCards, window.location.origin)
                  }
                  disabled={loading || reminderAdmitCards.length === 0}
                  label="Exam Date and Admit Card Reminder"
                />
              </div>

              {loading ? (
                <p className="os-side-status">Loading reminders...</p>
              ) : reminderAdmitCards.length === 0 ? (
                <p className="os-side-status">
                  No exam or admit card date in this category within the next 7 days.
                </p>
              ) : (
                <div className="os-reminder-list">
                  {reminderAdmitCards.map((admitCard) => (
                    <ReminderItem key={admitCard.id} admitCard={admitCard} />
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

        .os-admit-stack-start,
        .os-date-green {
          color: #166534;
        }

        .os-admit-stack-end,
        .os-date-red {
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

        .os-category-admit-list {
          display: grid;
          gap: 10px;
          padding: 14px;
        }

        .os-category-admit-item {
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

        .os-category-admit-item:hover {
          background: #fff7ed;
          border-color: #fed7aa;
          transform: translateY(-1px);
        }

        .os-category-admit-item h3 {
          margin: 0;
          color: #1d4ed8;
          font-size: 15px;
          line-height: 1.35;
          font-weight: 900;
          letter-spacing: -0.01em;
        }

        .os-category-admit-item:hover h3 {
          color: #ea580c;
        }

        .os-category-admit-item p {
          margin: 5px 0 0;
          color: #475569;
          font-size: 13px;
          line-height: 1.35;
          font-weight: 800;
        }

        .os-category-admit-date-grid {
          min-width: 190px;
          display: grid;
          gap: 5px;
          justify-items: end;
        }

        .os-category-admit-date-grid span {
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
          flex: 0 0 auto;
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

          .os-category-admit-item {
            grid-template-columns: 1fr;
          }

          .os-category-admit-date-grid {
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
          .os-admit-stack-grid {
            grid-template-columns: 1fr;
            padding: 12px;
          }

          .os-admit-stack-card {
            min-height: 104px;
          }

          .os-category-admit-list {
            padding: 12px;
          }

          .os-category-admit-date-grid span {
            white-space: normal;
          }
        }
      `}</style>
    </main>
  );
}
