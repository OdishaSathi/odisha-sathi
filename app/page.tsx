"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import ReminderShareButtons from "@/components/public/ReminderShareButtons";
import { buildLastDateReminderShareText } from "@/lib/reminderShare";
import { isPublicListingPost } from "@/lib/publicPostQuality";

const LATEST_TILE_LIMIT = 12;
const JOB_SECTION_LIMIT = 18;
const SECONDARY_SECTION_LIMIT = 6;
const SCHEME_PAGE_SIZE = 10;
const IMPORTANT_INFO_TILE_LIMIT = 8;
const IMPORTANT_INFO_PAGE_SIZE = 10;

type ImportantDate = {
  label?: string;
  title?: string;
  name?: string;
  key?: string;
  value?: string;
  date?: string;
  dateValue?: string;
  dateText?: string;
  description?: string;
};

type PostItem = {
  id: string;
  title?: string;
  slug?: string;
  category?: string;
  schemeName?: string;
  schemeCategory?: string;
  department?: string;
  organization?: string;
  institute?: string;
  board?: string;
  examName?: string;
  description?: string;
  content?: string;
  startDate?: string;
  applicationStartDate?: string;
  applyStartDate?: string;
  applicationOpenDate?: string;
  openingDate?: string;
  resultDate?: string;
  examDate?: string;
  examinationDate?: string;
  testDate?: string;
  writtenExamDate?: string;
  admitCardDate?: string;
  admitCardReleaseDate?: string;
  admitCardDownloadDate?: string;
  hallTicketDate?: string;
  releaseDate?: string;
  lastDate?: string;
  applicationLastDate?: string;
  applyLastDate?: string;
  applyEndDate?: string;
  onlineApplyLastDate?: string;
  formLastDate?: string;
  registrationLastDate?: string;
  registrationEndDate?: string;
  lastDateToApply?: string;
  lastDateOfApplication?: string;
  applicationEndDate?: string;
  closingDate?: string;
  endDate?: string;
  deadline?: string;
  deadlineDate?: string;
  examStartDate?: string;
  examEndDate?: string;
  examScheduleDate?: string;
  examDateTime?: string;
  downloadDate?: string;
  downloadStartDate?: string;
  downloadEndDate?: string;
  hallTicketReleaseDate?: string;
  importantDates?: ImportantDate[];
  createdAt?: any;
};

type ImportantInformationItem = {
  id: string;
  title?: string;
  slug?: string;
  shortDescription?: string;
  isFeatured?: boolean;
  featuredOrder?: number;
  status?: string;
  imageUrls?: string[];
  shareImageUrl?: string;
  createdAt?: any;
};

type HomeData = {
  importantFeatured: ImportantInformationItem[];
  importantAll: ImportantInformationItem[];
  latestTiles: PostItem[];
  jobs: PostItem[];
  admitCards: PostItem[];
  results: PostItem[];
  admissions: PostItem[];
  schemes: PostItem[];
  reminders: PostItem[];
};

const emptyHomeData: HomeData = {
  importantFeatured: [],
  importantAll: [],
  latestTiles: [],
  jobs: [],
  admitCards: [],
  results: [],
  admissions: [],
  schemes: [],
  reminders: [],
};

function normalizeDateOnly(date: Date) {
  const cleanDate = new Date(date);
  cleanDate.setHours(0, 0, 0, 0);
  return cleanDate;
}

function isValidDatePart(day: number, month: number, year: number) {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function parseDateCandidates(value?: any) {
  if (!value) return [];

  if (typeof value === "object" && typeof value.seconds === "number") {
    return [normalizeDateOnly(new Date(value.seconds * 1000))];
  }

  if (typeof value === "object" && typeof value.toDate === "function") {
    return [normalizeDateOnly(value.toDate())];
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return [normalizeDateOnly(value)];
  }

  if (typeof value !== "string") return [];

  const cleanValue = value.trim();

  if (!cleanValue) return [];

  const dates: Date[] = [];
  const seen = new Set<string>();

  const addDate = (date: Date) => {
    if (Number.isNaN(date.getTime())) return;

    const cleanDate = normalizeDateOnly(date);
    const key = cleanDate.toISOString();

    if (!seen.has(key)) {
      seen.add(key);
      dates.push(cleanDate);
    }
  };

  const ddmmyyyyRegex = /(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/g;
  let ddmmyyyyMatch: RegExpExecArray | null;

  while ((ddmmyyyyMatch = ddmmyyyyRegex.exec(cleanValue)) !== null) {
    const day = Number(ddmmyyyyMatch[1]);
    const month = Number(ddmmyyyyMatch[2]);
    const year = Number(ddmmyyyyMatch[3]);

    if (isValidDatePart(day, month, year)) {
      addDate(new Date(year, month - 1, day));
    }
  }

  const yyyymmddRegex = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/g;
  let yyyymmddMatch: RegExpExecArray | null;

  while ((yyyymmddMatch = yyyymmddRegex.exec(cleanValue)) !== null) {
    const year = Number(yyyymmddMatch[1]);
    const month = Number(yyyymmddMatch[2]);
    const day = Number(yyyymmddMatch[3]);

    if (isValidDatePart(day, month, year)) {
      addDate(new Date(year, month - 1, day));
    }
  }

  const textDateRegex =
    /(\d{1,2})\s+(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december),?\s+(\d{4})/gi;
  const monthMap: Record<string, number> = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
  };

  let textDateMatch: RegExpExecArray | null;

  while ((textDateMatch = textDateRegex.exec(cleanValue)) !== null) {
    const day = Number(textDateMatch[1]);
    const month = monthMap[textDateMatch[2].toLowerCase()];
    const year = Number(textDateMatch[3]);

    if (isValidDatePart(day, month, year)) {
      addDate(new Date(year, month - 1, day));
    }
  }

  if (dates.length > 0) return dates;

  const parsedDate = new Date(cleanValue);

  if (!Number.isNaN(parsedDate.getTime())) {
    return [normalizeDateOnly(parsedDate)];
  }

  return [];
}

function parseDateValue(value?: any) {
  const dates = parseDateCandidates(value);
  return dates[0] || null;
}

function parseStartDateValue(value?: any) {
  const dates = parseDateCandidates(value);
  return dates[0] || null;
}

function parseEndDateValue(value?: any) {
  const dates = parseDateCandidates(value);
  return dates[dates.length - 1] || null;
}

function formatDateFromParser(
  value?: any,
  parser: (dateValue?: any) => Date | null = parseDateValue
) {
  if (!value) return "";

  const date = parser(value);

  if (!date) {
    return typeof value === "string" ? value.trim() : "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateForPurpose(value?: any, purpose: "start" | "end" = "start") {
  return formatDateFromParser(
    value,
    purpose === "end" ? parseEndDateValue : parseStartDateValue
  );
}

function getTimeValue(item: PostItem) {
  if (item.createdAt?.seconds) {
    return item.createdAt.seconds;
  }

  if (typeof item.createdAt?.toMillis === "function") {
    return Math.floor(item.createdAt.toMillis() / 1000);
  }

  const parsedDate = parseDateValue(item.createdAt);

  return parsedDate ? Math.floor(parsedDate.getTime() / 1000) : 0;
}

function formatShortDate(value?: any) {
  return formatDateFromParser(value);
}

function formatTileEndDate(value?: any) {
  if (!value) return "";

  const date = parseEndDateValue(value);

  if (!date) {
    return typeof value === "string" ? value.trim() : "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function getImportantDateValue(
  item: PostItem,
  matcher: (label: string) => boolean
) {
  const matchedDate = item.importantDates?.find((dateItem) => {
    const label = String(
      dateItem.label ||
        dateItem.title ||
        dateItem.name ||
        dateItem.key ||
        ""
    ).toLowerCase();

    return matcher(label);
  });

  return (
    matchedDate?.value ||
    matchedDate?.date ||
    matchedDate?.dateValue ||
    matchedDate?.dateText ||
    matchedDate?.description ||
    ""
  );
}

function getRawStartDate(item: PostItem) {
  const directDate =
    item.startDate ||
    item.applicationStartDate ||
    item.applyStartDate ||
    item.applicationOpenDate ||
    item.openingDate ||
    item.resultDate ||
    item.examDate ||
    item.examinationDate ||
    item.admitCardDate ||
    item.admitCardReleaseDate ||
    item.releaseDate ||
    "";

  if (directDate) return directDate;

  return getImportantDateValue(item, (label) => {
    return (
      label.includes("start") ||
      label.includes("opening") ||
      label.includes("begin") ||
      label.includes("result") ||
      label.includes("exam") ||
      label.includes("admit") ||
      label.includes("release")
    );
  });
}

function getRawEndDate(item: PostItem) {
  const directDate =
    item.lastDate ||
    item.applicationLastDate ||
    item.applyLastDate ||
    item.applyEndDate ||
    item.onlineApplyLastDate ||
    item.formLastDate ||
    item.registrationLastDate ||
    item.registrationEndDate ||
    item.lastDateToApply ||
    item.lastDateOfApplication ||
    item.applicationEndDate ||
    item.closingDate ||
    item.endDate ||
    item.deadline ||
    item.deadlineDate ||
    "";

  if (directDate) return directDate;

  return getImportantDateValue(item, (label) => {
    return (
      label.includes("last") ||
      label.includes("closing") ||
      label.includes("deadline") ||
      label.includes("due") ||
      label.includes("end") ||
      label.includes("apply upto") ||
      label.includes("apply up to") ||
      label.includes("registration")
    );
  });
}

function getRawExamDate(item: PostItem) {
  const directDate =
    item.examDate ||
    item.examinationDate ||
    item.examStartDate ||
    item.examEndDate ||
    item.examScheduleDate ||
    item.examDateTime ||
    item.testDate ||
    item.writtenExamDate ||
    "";

  if (directDate) return directDate;

  return getImportantDateValue(item, (label) => {
    return (
      label.includes("exam") ||
      label.includes("examination") ||
      label.includes("test") ||
      label.includes("written")
    );
  });
}

function getRawAdmitCardDate(item: PostItem) {
  const directDate =
    item.admitCardDate ||
    item.admitCardReleaseDate ||
    item.admitCardDownloadDate ||
    item.hallTicketDate ||
    item.hallTicketReleaseDate ||
    item.downloadDate ||
    item.downloadStartDate ||
    item.downloadEndDate ||
    item.releaseDate ||
    "";

  if (directDate) return directDate;

  return getImportantDateValue(item, (label) => {
    return (
      label.includes("admit") ||
      label.includes("hall ticket") ||
      label.includes("download") ||
      label.includes("release")
    );
  });
}

function getReminderDateInfo(item: PostItem) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateOptions: { label: string; rawDate: any; date: Date }[] = [];

  const addOption = (label: string, rawDate: any) => {
    const parsedDate = parseEndDateValue(rawDate);

    if (!parsedDate) return;

    dateOptions.push({
      label,
      rawDate,
      date: parsedDate,
    });
  };

  if (item.category === "admit-cards") {
    addOption("Admit Card Date", getRawAdmitCardDate(item));
    addOption("Exam Date", getRawExamDate(item));
    addOption("Last Date", getRawEndDate(item));
  } else {
    addOption("Last Date", getRawEndDate(item));
  }

  if (dateOptions.length === 0) return null;

  const upcomingOptions = dateOptions
    .filter((option) => option.date.getTime() >= today.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (upcomingOptions.length > 0) {
    return upcomingOptions[0];
  }

  return null;
}

function getPublishedDate(item: PostItem) {
  return formatShortDate(item.createdAt);
}

function getStartDate(item: PostItem) {
  return formatDateForPurpose(getRawStartDate(item), "start");
}

function getEndDate(item: PostItem) {
  return formatDateForPurpose(getRawEndDate(item), "end");
}

function getReminderDateLabel(item: PostItem) {
  const reminderInfo = getReminderDateInfo(item);

  if (!reminderInfo) return "";

  return `${reminderInfo.label}: ${formatDateForPurpose(
    reminderInfo.rawDate,
    "end"
  )}`;
}

function getTileEndDate(item: PostItem) {
  const reminderInfo = getReminderDateInfo(item);
  return formatTileEndDate(reminderInfo?.rawDate || getRawEndDate(item));
}

function getEndDateTime(item: PostItem) {
  const reminderInfo = getReminderDateInfo(item);

  if (!reminderInfo) return Number.POSITIVE_INFINITY;

  const date = new Date(reminderInfo.date);
  date.setHours(23, 59, 59, 999);

  return date.getTime();
}

function getTitle(item: PostItem) {
  if (item.category === "schemes") {
    return item.schemeName || item.title || "Untitled Scheme";
  }

  return item.title || "Untitled Update";
}

function getCategoryLabel(item: PostItem) {
  if (item.category === "jobs") return "Latest Jobs";
  if (item.category === "results") return "Results";
  if (item.category === "admissions") return "Admissions";
  if (item.category === "admit-cards") return "Admit Cards & Exams";
  if (item.category === "schemes") return "Schemes";
  return "Update";
}

function getTileDepartment(item: PostItem) {
  const text =
    item.department ||
    item.organization ||
    item.institute ||
    item.board ||
    item.examName ||
    item.schemeCategory ||
    getCategoryLabel(item);

  return text || "Odisha Sathi";
}

function getLink(item: PostItem) {
  return `/post/${item.slug || item.id}`;
}

function isAllowedLatestPost(item: PostItem) {
  if (!item.category) return false;
  if (item.category === "tools") return false;
  if (item.category === "scheme-category") return false;

  return [
    "jobs",
    "results",
    "admissions",
    "admit-cards",
    "schemes",
  ].includes(item.category);
}

function isLastDateReminderPost(item: PostItem) {
  if (!isAllowedLatestPost(item)) return false;

  const reminderInfo = getReminderDateInfo(item);

  if (!reminderInfo) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 7);
  sevenDaysLater.setHours(23, 59, 59, 999);

  const reminderDate = new Date(reminderInfo.date);
  reminderDate.setHours(23, 59, 59, 999);

  return (
    reminderDate.getTime() >= today.getTime() &&
    reminderDate.getTime() <= sevenDaysLater.getTime()
  );
}

function normalizeText(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function normalizePostCategory(category?: string) {
  const cleanCategory = normalizeText(category);
  const compactCategory = cleanCategory.replace(/[^a-z0-9]/g, "");

  if (
    cleanCategory === "job" ||
    cleanCategory === "jobs" ||
    cleanCategory === "latest jobs" ||
    compactCategory === "job" ||
    compactCategory === "jobs"
  ) {
    return "jobs";
  }

  if (
    cleanCategory === "result" ||
    cleanCategory === "results" ||
    cleanCategory === "latest results" ||
    compactCategory === "result" ||
    compactCategory === "results"
  ) {
    return "results";
  }

  if (
    cleanCategory === "admission" ||
    cleanCategory === "admissions" ||
    cleanCategory === "latest admissions" ||
    compactCategory === "admission" ||
    compactCategory === "admissions"
  ) {
    return "admissions";
  }

  if (
    cleanCategory === "admit-cards" ||
    cleanCategory === "admit-card" ||
    cleanCategory === "admitcards" ||
    cleanCategory === "admitcard" ||
    cleanCategory === "admit card" ||
    cleanCategory === "admit cards" ||
    cleanCategory === "exam" ||
    cleanCategory === "exams" ||
    cleanCategory === "admit cards & exams" ||
    cleanCategory === "admit-cards-exams" ||
    compactCategory === "admitcards" ||
    compactCategory === "admitcard" ||
    compactCategory === "admitcardsandexams" ||
    compactCategory === "exam" ||
    compactCategory === "exams"
  ) {
    return "admit-cards";
  }

  if (
    cleanCategory === "scheme" ||
    cleanCategory === "schemes" ||
    cleanCategory === "government schemes" ||
    cleanCategory === "government-schemes" ||
    cleanCategory === "govt schemes" ||
    cleanCategory === "govt-schemes" ||
    compactCategory === "scheme" ||
    compactCategory === "schemes" ||
    compactCategory === "governmentschemes" ||
    compactCategory === "govtschemes"
  ) {
    return "schemes";
  }

  return category || "";
}

function createPostItem(
  id: string,
  data: any,
  categoryOverride?: string
): PostItem {
  const category = normalizePostCategory(categoryOverride || data.category || "");

  return {
    id,
    title: data.title || data.schemeName || "",
    slug: data.slug || "",
    category,
    schemeName: data.schemeName || data.title || "",
    schemeCategory:
      data.schemeCategory ||
      data.schemeSubCategory ||
      data.selectedSchemeCategory ||
      "",
    department: data.department || "",
    organization: data.organization || "",
    institute: data.institute || data.instituteName || "",
    board: data.board || data.boardName || "",
    examName: data.examName || data.exam || "",
    description: data.description || data.shortDescription || "",
    content: data.content || "",
    startDate:
      data.startDate ||
      data.applicationStartDate ||
      data.applyStartDate ||
      data.applicationOpenDate ||
      data.openingDate ||
      data.resultDate ||
      data.examDate ||
      data.examinationDate ||
      data.admitCardDate ||
      data.admitCardReleaseDate ||
      data.releaseDate ||
      "",
    applicationStartDate: data.applicationStartDate || "",
    applyStartDate: data.applyStartDate || "",
    applicationOpenDate: data.applicationOpenDate || "",
    openingDate: data.openingDate || "",
    resultDate: data.resultDate || "",
    examDate: data.examDate || "",
    examinationDate: data.examinationDate || "",
    testDate: data.testDate || "",
    writtenExamDate: data.writtenExamDate || "",
    examStartDate: data.examStartDate || "",
    examEndDate: data.examEndDate || "",
    examScheduleDate: data.examScheduleDate || "",
    examDateTime: data.examDateTime || "",
    admitCardDate: data.admitCardDate || "",
    admitCardReleaseDate: data.admitCardReleaseDate || "",
    admitCardDownloadDate: data.admitCardDownloadDate || "",
    hallTicketDate: data.hallTicketDate || "",
    hallTicketReleaseDate: data.hallTicketReleaseDate || "",
    downloadDate: data.downloadDate || "",
    downloadStartDate: data.downloadStartDate || "",
    downloadEndDate: data.downloadEndDate || "",
    releaseDate: data.releaseDate || "",
    lastDate:
      data.lastDate ||
      data.applicationLastDate ||
      data.applyLastDate ||
      data.applyEndDate ||
      data.onlineApplyLastDate ||
      data.formLastDate ||
      data.registrationLastDate ||
      data.registrationEndDate ||
      data.lastDateToApply ||
      data.lastDateOfApplication ||
      data.applicationEndDate ||
      data.closingDate ||
      data.endDate ||
      data.deadline ||
      data.deadlineDate ||
      "",
    applicationLastDate: data.applicationLastDate || "",
    applyLastDate: data.applyLastDate || "",
    applyEndDate: data.applyEndDate || "",
    onlineApplyLastDate: data.onlineApplyLastDate || "",
    formLastDate: data.formLastDate || "",
    registrationLastDate: data.registrationLastDate || "",
    registrationEndDate: data.registrationEndDate || "",
    lastDateToApply: data.lastDateToApply || "",
    lastDateOfApplication: data.lastDateOfApplication || "",
    applicationEndDate: data.applicationEndDate || "",
    closingDate: data.closingDate || "",
    endDate: data.endDate || "",
    deadline: data.deadline || "",
    deadlineDate: data.deadlineDate || "",
    importantDates: Array.isArray(data.importantDates)
      ? data.importantDates
      : [],
    createdAt: data.createdAt || null,
  };
}

function createPublicPostItems(
  documents: Array<{ id: string; data: () => any }>,
  categoryOverride?: string
) {
  return documents
    .filter((docItem) =>
      isPublicListingPost(
        { ...docItem.data(), category: categoryOverride || docItem.data().category },
        docItem.id
      )
    )
    .map((docItem) =>
      createPostItem(docItem.id, docItem.data(), categoryOverride)
    );
}

function getDedupedPosts(items: PostItem[]) {
  return Array.from(
    new Map(
      items.map((item) => [`${item.category}-${item.slug || item.id}`, item])
    ).values()
  );
}

function createImportantInformationItem(id: string, data: any): ImportantInformationItem {
  return {
    id,
    title: data.title || "",
    slug: data.slug || "",
    shortDescription: data.shortDescription || data.shareDescription || "",
    isFeatured: Boolean(data.isFeatured),
    featuredOrder: Number(data.featuredOrder || 0),
    status: data.status || "published",
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
    shareImageUrl: data.shareImageUrl || "",
    createdAt: data.createdAt || null,
  };
}

function getImportantInfoTimeValue(item: ImportantInformationItem) {
  if (item.createdAt?.seconds) return item.createdAt.seconds;
  if (typeof item.createdAt?.toMillis === "function") {
    return Math.floor(item.createdAt.toMillis() / 1000);
  }
  return 0;
}

function getImportantInfoLink(item: ImportantInformationItem) {
  return `/important-information/${item.slug || item.id}`;
}

function buildHomeReminderShareText(reminders: PostItem[], origin: string) {
  return buildLastDateReminderShareText(
    reminders.map((item) => {
      const reminderInfo = getReminderDateInfo(item);
      return {
        title: getTitle(item),
        category: getCategoryLabel(item),
        lastDate: reminderInfo
          ? formatDateForPurpose(reminderInfo.rawDate, "end")
          : "Date not available",
        dateLabel: reminderInfo?.label || "Last Date",
        url: `${origin}${getLink(item)}`,
      };
    })
  );
}

function LatestPostTile({ item }: { item: PostItem; index: number }) {
  const endDate = getTileEndDate(item);

  return (
    <Link href={getLink(item)} className="os-latest-tile">
      <div className="os-latest-tile-content">
        <h3>{getTitle(item)}</h3>
        <p>{getTileDepartment(item)}</p>
      </div>

      {endDate ? (
        <strong className="os-latest-end-date">End Date - {endDate}</strong>
      ) : null}
    </Link>
  );
}

function ImportantInfoTile({ item }: { item: ImportantInformationItem; index: number }) {
  return (
    <Link href={getImportantInfoLink(item)} className="os-important-info-tile">
      <h3>{item.title || "Important Information"}</h3>
      {item.shortDescription ? <p>{item.shortDescription}</p> : null}
    </Link>
  );
}

function ImportantInfoRow({ item }: { item: ImportantInformationItem }) {
  return (
    <Link href={getImportantInfoLink(item)} className="os-important-info-row">
      <div>
        <span>Important Information</span>
        <h3>{item.title || "Important Information"}</h3>
      </div>
      {item.shortDescription ? <p>{item.shortDescription}</p> : null}
    </Link>
  );
}

function ImportantInformationHighlights({ items }: { items: ImportantInformationItem[] }) {
  return (
    <section className="os-important-info-section">
      <div className="os-board-section-head os-important-info-head">
        <h2>Important Information</h2>
      </div>

      {items.length === 0 ? (
        <p className="os-board-empty">Important information will be updated soon.</p>
      ) : (
        <div className="os-important-info-grid">
          {items.slice(0, IMPORTANT_INFO_TILE_LIMIT).map((item, index) => (
            <ImportantInfoTile key={`important-tile-${item.id}`} item={item} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}

function AllImportantInformationStack({
  items,
  visibleCount,
  onViewMore,
}: {
  items: ImportantInformationItem[];
  visibleCount: number;
  onViewMore: () => void;
}) {
  const visibleItems = items.slice(0, visibleCount);

  return (
    <section className="os-all-important-info-section">
      <div className="os-home-panel-head">
        <h2>All Important Information</h2>
      </div>

      {items.length === 0 ? (
        <p className="os-home-empty">No important information available.</p>
      ) : (
        <>
          <div className="os-all-important-info-list">
            {visibleItems.map((item) => (
              <ImportantInfoRow key={`important-row-${item.id}`} item={item} />
            ))}
          </div>

          {visibleCount < items.length ? (
            <div className="os-important-view-more-wrap">
              <button type="button" onClick={onViewMore}>
                View More
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function HomeUpdateRow({ item }: { item: PostItem }) {
  const publishedDate = getPublishedDate(item);
  const startDate = getStartDate(item);
  const endDate = getEndDate(item);

  return (
    <Link href={getLink(item)} className="os-home-update-row">
      <h3>{getTitle(item)}</h3>

      <div className="os-home-date-row">
        {publishedDate ? (
          <span className="os-date-published">Published: {publishedDate}</span>
        ) : null}

        {startDate ? (
          <span className="os-date-start">Start: {startDate}</span>
        ) : null}

        {endDate ? <span className="os-date-end">End: {endDate}</span> : null}
      </div>
    </Link>
  );
}

function HomeSectionPanel({
  title,
  href,
  items,
  emptyText,
  limit = SECONDARY_SECTION_LIMIT,
  className = "",
}: {
  title: string;
  href: string;
  items: PostItem[];
  emptyText: string;
  limit?: number;
  className?: string;
}) {
  return (
    <section className={`os-home-panel ${className}`.trim()}>
      <div className="os-home-panel-head">
        <h2>{title}</h2>
        <Link href={href}>View All</Link>
      </div>

      {items.length === 0 ? (
        <p className="os-home-empty">{emptyText}</p>
      ) : (
        <div className="os-home-update-list">
          {items.slice(0, limit).map((item) => (
            <HomeUpdateRow key={`${item.category}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function SchemeRow({ item }: { item: PostItem }) {
  const startDate = getStartDate(item);
  const endDate = getEndDate(item);

  return (
    <Link href={getLink(item)} className="os-home-scheme-row">
      <h3>{getTitle(item)}</h3>

      <div className="os-home-date-row">
        {startDate ? (
          <span className="os-date-start">Start: {startDate}</span>
        ) : null}

        {endDate ? <span className="os-date-end">End: {endDate}</span> : null}
      </div>
    </Link>
  );
}

function ReminderRow({ item }: { item: PostItem }) {
  const reminderDateLabel = getReminderDateLabel(item);

  return (
    <Link href={getLink(item)} className="os-home-reminder-row">
      <div>
        <span>{getCategoryLabel(item)}</span>
        <h3>{getTitle(item)}</h3>
      </div>

      {reminderDateLabel ? <strong>{reminderDateLabel}</strong> : null}
    </Link>
  );
}

const quickAccessLinks = [
  { label: "Latest Jobs", href: "/jobs" },
  { label: "Admit Cards & Exams", href: "/admit-cards" },
  { label: "Results", href: "/results" },
  { label: "Admissions", href: "/admissions" },
  { label: "Schemes", href: "/schemes" },
  { label: "Tools", href: "/tools" },
];

export default function HomePage() {
  const [homeData, setHomeData] = useState<HomeData>(emptyHomeData);
  const [loading, setLoading] = useState(true);
  const [visibleImportantCount, setVisibleImportantCount] = useState(IMPORTANT_INFO_PAGE_SIZE);
  const [visibleSchemeCount, setVisibleSchemeCount] = useState(SCHEME_PAGE_SIZE);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);

        const [
          postsSnapshot,
          jobsSnapshot,
          admissionsSnapshot,
          admitCardsSnapshot,
          admitCardsHyphenSnapshot,
          admitCardsLowerSnapshot,
          resultsSnapshot,
          resultSnapshot,
          schemesSnapshot,
          schemeSnapshot,
          governmentSchemesSnapshot,
          governmentSchemesHyphenSnapshot,
          importantInformationSnapshot,
        ] = await Promise.all([
          getDocs(collection(db, "posts")),
          getDocs(collection(db, "jobs")),
          getDocs(collection(db, "admissions")),
          getDocs(collection(db, "admitCards")),
          getDocs(collection(db, "admit-cards")),
          getDocs(collection(db, "admitcards")),
          getDocs(collection(db, "results")),
          getDocs(collection(db, "result")),
          getDocs(collection(db, "schemes")),
          getDocs(collection(db, "scheme")),
          getDocs(collection(db, "governmentSchemes")),
          getDocs(collection(db, "government-schemes")),
          getDocs(collection(db, "importantInformation")),
        ]);

        const postItems: PostItem[] = createPublicPostItems(postsSnapshot.docs);

        const jobCollectionItems: PostItem[] = createPublicPostItems(
          jobsSnapshot.docs,
          "jobs"
        );

        const admissionCollectionItems: PostItem[] =
          createPublicPostItems(
            admissionsSnapshot.docs,
            "admissions"
          );

        const admitCardItems: PostItem[] = [
          ...createPublicPostItems(admitCardsSnapshot.docs, "admit-cards"),
          ...createPublicPostItems(
            admitCardsHyphenSnapshot.docs,
            "admit-cards"
          ),
          ...createPublicPostItems(
            admitCardsLowerSnapshot.docs,
            "admit-cards"
          ),
        ];

        const resultItems: PostItem[] = [
          ...createPublicPostItems(resultsSnapshot.docs, "results"),
          ...createPublicPostItems(resultSnapshot.docs, "results"),
        ];

        const schemeCollectionItems: PostItem[] = [
          ...createPublicPostItems(schemesSnapshot.docs, "schemes"),
          ...createPublicPostItems(schemeSnapshot.docs, "schemes"),
          ...createPublicPostItems(
            governmentSchemesSnapshot.docs,
            "schemes"
          ),
          ...createPublicPostItems(
            governmentSchemesHyphenSnapshot.docs,
            "schemes"
          ),
        ];

        const importantInformationItems: ImportantInformationItem[] =
          importantInformationSnapshot.docs
            .map((docItem) => createImportantInformationItem(docItem.id, docItem.data()))
            .filter((item) => item.status !== "hidden")
            .sort((a, b) => getImportantInfoTimeValue(b) - getImportantInfoTimeValue(a));

        const importantFeatured = [...importantInformationItems]
          .filter((item) => item.isFeatured)
          .sort((a, b) => {
            const orderDiff = (a.featuredOrder || 0) - (b.featuredOrder || 0);
            if (orderDiff !== 0) return orderDiff;
            return getImportantInfoTimeValue(b) - getImportantInfoTimeValue(a);
          })
          .slice(0, IMPORTANT_INFO_TILE_LIMIT);

        const allItems = getDedupedPosts([
          ...postItems,
          ...jobCollectionItems,
          ...admissionCollectionItems,
          ...admitCardItems,
          ...resultItems,
          ...schemeCollectionItems,
        ]);

        const jobs = allItems
          .filter((item) => item.category === "jobs")
          .sort((a, b) => getTimeValue(b) - getTimeValue(a));

        const admissions = allItems
          .filter((item) => item.category === "admissions")
          .sort((a, b) => getTimeValue(b) - getTimeValue(a));

        const schemes = allItems
          .filter((item) => item.category === "schemes")
          .sort((a, b) => getTimeValue(b) - getTimeValue(a));

        const admitCards = allItems
          .filter((item) => item.category === "admit-cards")
          .sort((a, b) => getTimeValue(b) - getTimeValue(a));

        const results = allItems
          .filter((item) => item.category === "results")
          .sort((a, b) => getTimeValue(b) - getTimeValue(a));

        const allAllowedPosts = [
          ...jobs,
          ...admitCards,
          ...results,
          ...admissions,
          ...schemes,
        ].filter(isAllowedLatestPost);

        const latestTiles = [...allAllowedPosts]
          .sort((a, b) => getTimeValue(b) - getTimeValue(a))
          .slice(0, LATEST_TILE_LIMIT);

        const reminders = [...allAllowedPosts]
          .filter(isLastDateReminderPost)
          .sort((a, b) => getEndDateTime(a) - getEndDateTime(b));

        setHomeData({
          importantFeatured,
          importantAll: importantInformationItems,
          latestTiles,
          jobs,
          admitCards,
          results,
          admissions,
          schemes,
          reminders,
        });

        setVisibleImportantCount(IMPORTANT_INFO_PAGE_SIZE);
        setVisibleSchemeCount(SCHEME_PAGE_SIZE);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const handleShareHomeReminders = () => {
    if (homeData.reminders.length === 0) return;

    const shareText = buildHomeReminderShareText(
      homeData.reminders,
      window.location.origin
    );

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="os-board-home">
      <div className="os-board-container">
        <section className="os-board-top">
          <div>
            <p className="os-board-kicker">Odisha Sathi Updates</p>
            <h1>jobs, results, admissions, admit cards & exams and schemes</h1>
          </div>
        </section>

        {loading ? (
          <div className="os-board-loading">Loading latest updates...</div>
        ) : (
          <>
            <ImportantInformationHighlights items={homeData.importantFeatured} />

            <section className="os-board-latest">
              <div className="os-board-section-head os-board-latest-head">
                <h2>Latest Posts</h2>
              </div>

              {homeData.latestTiles.length === 0 ? (
                <p className="os-board-empty">No latest posts available.</p>
              ) : (
                <div className="os-latest-tile-grid">
                  {homeData.latestTiles.map((item, index) => (
                    <LatestPostTile
                      key={`latest-${item.category}-${item.id}`}
                      item={item}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="os-home-main-layout">
              <div className="os-home-left-column">
                <div className="os-home-update-comparison">
                  <HomeSectionPanel
                    title="Latest Jobs"
                    href="/jobs"
                    items={homeData.jobs}
                    emptyText="No latest jobs available."
                    limit={JOB_SECTION_LIMIT}
                    className="os-home-jobs-panel"
                  />

                  <div className="os-home-secondary-stack">
                    <HomeSectionPanel
                      title="Latest Admit Cards & Exams"
                      href="/admit-cards"
                      items={homeData.admitCards}
                      emptyText="No latest admit cards and exams available."
                    />

                    <HomeSectionPanel
                      title="Latest Results"
                      href="/results"
                      items={homeData.results}
                      emptyText="No latest results available."
                    />

                    <HomeSectionPanel
                      title="Latest Admissions"
                      href="/admissions"
                      items={homeData.admissions}
                      emptyText="No latest admissions available."
                    />
                  </div>
                </div>
              </div>

              <aside className="os-home-right-column">
                <section className="os-home-quick-panel">
                  <div className="os-home-panel-head">
                    <h2>Quick Access</h2>
                  </div>

                  <div className="os-home-quick-grid">
                    {quickAccessLinks.map((item) => (
                      <Link key={item.href} href={item.href}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="os-home-reminder-panel">
                  <div className="os-home-panel-head">
                    <h2>Last Date Reminder</h2>

                    <ReminderShareButtons
                      getShareText={() =>
                        buildHomeReminderShareText(homeData.reminders, window.location.origin)
                      }
                      disabled={homeData.reminders.length === 0}
                      label="Last Date Reminder"
                    />
                  </div>

                  {homeData.reminders.length === 0 ? (
                    <p className="os-home-empty">
                      No deadlines within the next 7 days.
                    </p>
                  ) : (
                    <div className="os-home-reminder-list">
                      {homeData.reminders.map((item) => (
                        <ReminderRow
                          key={`reminder-${item.category}-${item.id}`}
                          item={item}
                        />
                      ))}
                    </div>
                  )}
                </section>

              </aside>
            </section>

            <section className="os-home-bottom-layout">
              <AllImportantInformationStack
                items={homeData.importantAll}
                visibleCount={visibleImportantCount}
                onViewMore={() =>
                  setVisibleImportantCount((oldValue) =>
                    oldValue + IMPORTANT_INFO_PAGE_SIZE
                  )
                }
              />

              <section className="os-home-scheme-panel os-home-bottom-schemes">
                <div className="os-home-panel-head">
                  <h2>Latest Schemes</h2>
                  <Link href="/schemes">View All</Link>
                </div>

                {homeData.schemes.length === 0 ? (
                  <p className="os-home-empty">No latest schemes available.</p>
                ) : (
                  <>
                    <div className="os-home-scheme-list">
                      {homeData.schemes.slice(0, visibleSchemeCount).map((item) => (
                        <SchemeRow key={`scheme-${item.id}`} item={item} />
                      ))}
                    </div>

                    {visibleSchemeCount < homeData.schemes.length ? (
                      <div className="os-important-view-more-wrap">
                        <button
                          type="button"
                          onClick={() =>
                            setVisibleSchemeCount((oldValue) => oldValue + SCHEME_PAGE_SIZE)
                          }
                        >
                          View More
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </section>
            </section>
          </>
        )}
      </div>

      <style jsx global>{`
        .os-board-home {
          min-height: 100vh;
          background: #ffffff;
          color: #0f172a;
        }

        .os-board-container {
          width: min(100% - 32px, 1180px);
          margin: 0 auto;
          padding: 22px 0 42px;
        }

        .os-board-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid #e5e7eb;
        }

        .os-board-kicker {
          margin: 0 0 6px;
          color: #ea580c;
          font-size: 13px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .os-board-top h1 {
          margin: 0;
          color: #0f172a;
          font-size: 32px;
          line-height: 1.12;
          font-weight: 950;
          letter-spacing: -0.04em;
          text-transform: capitalize;
        }

        .os-board-loading,
        .os-board-empty,
        .os-home-empty {
          margin: 0;
          padding: 14px 16px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 600;
        }

        .os-board-loading {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #ffffff;
        }

        .os-board-latest {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          background: #ffffff;
          margin-bottom: 18px;
        }

        .os-important-info-section,
        .os-all-important-info-section {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          background: #ffffff;
          margin-bottom: 18px;
        }

        .os-all-important-info-section {
          margin: 0;
          width: 100%;
          max-width: 100%;
        }

        .os-important-info-head h2 {
          color: #dc2626;
        }

        .os-important-info-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          padding: 14px;
        }

        .os-important-info-tile {
          display: grid;
          align-content: start;
          min-height: 92px;
          padding: 13px 14px;
          border: 1px solid #fee2e2;
          border-radius: 12px;
          background: linear-gradient(135deg, #fff7ed, #fee2e2);
          color: inherit;
          text-decoration: none;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.05);
          transition:
            transform 0.16s ease,
            box-shadow 0.16s ease,
            border-color 0.16s ease;
        }

        .os-important-info-tile:hover {
          transform: translateY(-3px) scale(1.015);
          border-color: rgba(220, 38, 38, 0.28);
          box-shadow: 0 16px 30px rgba(15, 23, 42, 0.12);
        }

        .os-important-info-tile span {
          margin-bottom: 7px;
          color: #dc2626;
          font-size: 10.5px;
          line-height: 1;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .os-important-info-tile h3 {
          margin: 0;
          color: #111827;
          font-size: 14.5px;
          line-height: 1.18;
          font-weight: 950;
          letter-spacing: -0.025em;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .os-important-info-tile p {
          margin: 7px 0 0;
          color: #475569;
          font-size: 12.5px;
          line-height: 1.3;
          font-weight: 750;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .os-all-important-info-list {
          display: grid;
        }

        .os-important-info-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(220px, 0.45fr);
          gap: 12px;
          align-items: center;
          padding: 12px 14px;
          border-bottom: 1px solid #f1f5f9;
          color: inherit;
          text-decoration: none;
          transition: background 0.15s ease;
        }

        .os-important-info-row:last-child {
          border-bottom: 0;
        }

        .os-important-info-row:hover {
          background: #fff7ed;
        }

        .os-important-info-row span {
          display: inline-flex;
          margin-bottom: 5px;
          color: #dc2626;
          font-size: 10.5px;
          line-height: 1;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .os-important-info-row h3 {
          margin: 0;
          color: #1d4ed8;
          font-size: 14.5px;
          line-height: 1.35;
          font-weight: 850;
          letter-spacing: -0.01em;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .os-important-info-row:hover h3 {
          color: #ea580c;
        }

        .os-important-info-row p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
          font-weight: 650;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .os-important-view-more-wrap {
          padding: 14px;
          border-top: 1px solid #f1f5f9;
          text-align: center;
        }

        .os-important-view-more-wrap button {
          min-height: 40px;
          padding: 9px 18px;
          border: 1px solid #2563eb;
          border-radius: 999px;
          background: #2563eb;
          color: #ffffff;
          font-weight: 900;
          cursor: pointer;
        }

        .os-board-section-head,
        .os-home-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .os-board-section-head h2,
        .os-home-panel-head h2 {
          margin: 0;
          color: #0f172a;
          font-size: 18px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: -0.025em;
        }

        .os-home-reminder-panel .os-home-panel-head h2 {
          color: #dc2626;
        }

        .os-home-whatsapp-share-btn {
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 999px;
          background: #25d366;
          color: #ffffff;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(37, 211, 102, 0.22);
          transition:
            transform 0.15s ease,
            opacity 0.15s ease,
            box-shadow 0.15s ease;
        }

        .os-home-whatsapp-share-btn svg {
          width: 20px;
          height: 20px;
          fill: currentColor;
        }

        .os-home-whatsapp-share-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(37, 211, 102, 0.3);
        }

        .os-home-whatsapp-share-btn:disabled {
          cursor: not-allowed;
          opacity: 0.45;
          box-shadow: none;
        }

        .os-home-whatsapp-share-btn:disabled:hover {
          transform: none;
        }

        .os-home-panel-head a {
          color: #2563eb;
          text-decoration: none;
          font-size: 13px;
          font-weight: 900;
          white-space: nowrap;
          transition: color 0.15s ease;
        }

        .os-home-panel-head a:hover {
          color: #ea580c;
          text-decoration: underline;
        }

        .os-latest-tile-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          padding: 14px;
        }

        .os-latest-tile {
          position: relative;
          min-height: 96px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          padding: 14px 14px 30px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 12px;
          color: #111827;
          text-decoration: none;
          overflow: hidden;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
          transition:
            transform 0.16s ease,
            box-shadow 0.16s ease,
            border-color 0.16s ease;
        }

        .os-latest-tile:nth-child(6n + 1) {
          background:
            radial-gradient(circle at 92% 10%, rgba(251, 191, 36, 0.34), transparent 38%),
            linear-gradient(135deg, #fff7ed, #fed7aa);
        }

        .os-latest-tile:nth-child(6n + 2) {
          background:
            radial-gradient(circle at 92% 10%, rgba(37, 99, 235, 0.2), transparent 38%),
            linear-gradient(135deg, #eff6ff, #dbeafe);
        }

        .os-latest-tile:nth-child(6n + 3) {
          background:
            radial-gradient(circle at 92% 10%, rgba(34, 197, 94, 0.24), transparent 38%),
            linear-gradient(135deg, #ecfdf5, #bbf7d0);
        }

        .os-latest-tile:nth-child(6n + 4) {
          background:
            radial-gradient(circle at 92% 10%, rgba(239, 68, 68, 0.22), transparent 38%),
            linear-gradient(135deg, #fff1f2, #fecdd3);
        }

        .os-latest-tile:nth-child(6n + 5) {
          background:
            radial-gradient(circle at 92% 10%, rgba(124, 58, 237, 0.2), transparent 38%),
            linear-gradient(135deg, #f5f3ff, #ddd6fe);
        }

        .os-latest-tile:nth-child(6n + 6) {
          background:
            radial-gradient(circle at 92% 10%, rgba(234, 179, 8, 0.25), transparent 38%),
            linear-gradient(135deg, #fefce8, #fde68a);
        }

        .os-latest-tile:hover {
          transform: translateY(-3px) scale(1.015);
          border-color: rgba(234, 88, 12, 0.28);
          box-shadow: 0 16px 30px rgba(15, 23, 42, 0.12);
        }

        .os-latest-tile h3 {
          margin: 0;
          color: #111827;
          font-size: 14.5px;
          line-height: 1.18;
          font-weight: 950;
          letter-spacing: -0.025em;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .os-latest-tile p {
          margin: 7px 0 0;
          color: #1f2937;
          font-size: 12.5px;
          line-height: 1.25;
          font-weight: 850;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .os-latest-end-date {
          position: absolute;
          right: 12px;
          bottom: 10px;
          color: #dc2626;
          font-size: 12px;
          line-height: 1;
          font-weight: 950;
          white-space: nowrap;
        }

        .os-home-main-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 18px;
          align-items: start;
        }

        .os-home-left-column {
          min-width: 0;
        }

        .os-home-update-comparison {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          align-items: stretch;
        }

        .os-home-secondary-stack {
          display: grid;
          gap: 16px;
        }

        .os-home-jobs-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .os-home-jobs-panel .os-home-update-list {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .os-home-jobs-panel .os-home-update-row {
          flex: 1 1 auto;
        }

        .os-home-bottom-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 18px;
          align-items: stretch;
          margin-top: 18px;
        }

        .os-home-bottom-schemes {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .os-home-bottom-schemes .os-home-scheme-list {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .os-home-bottom-schemes .os-home-scheme-row {
          flex: 1 1 auto;
        }

        .os-home-right-column {
          min-width: 0;
          display: grid;
          gap: 16px;
          position: sticky;
          top: 92px;
        }

        .os-home-panel,
        .os-home-scheme-panel,
        .os-home-quick-panel,
        .os-home-reminder-panel {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          background: #ffffff;
        }

        .os-home-update-list,
        .os-home-scheme-list,
        .os-home-reminder-list {
          display: grid;
        }

        .os-home-update-row,
        .os-home-scheme-row {
          display: block;
          padding: 12px 14px;
          border-bottom: 1px solid #f1f5f9;
          color: inherit;
          text-decoration: none;
          transition: background 0.15s ease;
        }

        .os-home-update-row:last-child,
        .os-home-scheme-row:last-child {
          border-bottom: none;
        }

        .os-home-update-row:hover,
        .os-home-scheme-row:hover {
          background: #fff7ed;
        }

        .os-home-update-row h3,
        .os-home-scheme-row h3 {
          margin: 0;
          color: #1d4ed8;
          font-size: 14.5px;
          line-height: 1.35;
          font-weight: 850;
          letter-spacing: -0.01em;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.15s ease;
        }

        .os-home-update-row:hover h3,
        .os-home-scheme-row:hover h3 {
          color: #ea580c;
        }

        .os-home-date-row {
          display: flex;
          flex-wrap: wrap;
          gap: 5px 9px;
          margin-top: 7px;
        }

        .os-home-date-row span {
          color: #475569;
          font-size: 11.5px;
          line-height: 1.2;
          font-weight: 850;
          white-space: nowrap;
          transition: color 0.15s ease;
        }

        .os-home-update-row:hover .os-date-start,
        .os-home-scheme-row:hover .os-date-start {
          color: #16a34a;
        }

        .os-home-update-row:hover .os-date-end,
        .os-home-scheme-row:hover .os-date-end {
          color: #dc2626;
        }

        .os-home-quick-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          padding: 14px;
        }

        .os-home-quick-grid a {
          display: flex;
          align-items: center;
          min-height: 40px;
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #ffffff;
          color: #1d4ed8;
          text-decoration: none;
          font-size: 13px;
          line-height: 1.2;
          font-weight: 900;
          transition:
            background 0.15s ease,
            color 0.15s ease,
            border-color 0.15s ease;
        }

        .os-home-quick-grid a:hover {
          background: #fff7ed;
          color: #ea580c;
          border-color: #fed7aa;
        }

        .os-home-reminder-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
          padding: 12px 14px;
          border-bottom: 1px solid #fee2e2;
          color: inherit;
          text-decoration: none;
          background: #fff7f7;
          transition: background 0.15s ease;
        }

        .os-home-reminder-row:last-child {
          border-bottom: none;
        }

        .os-home-reminder-row:hover {
          background: #fff1f2;
        }

        .os-home-reminder-row span {
          display: inline-flex;
          margin-bottom: 5px;
          color: #dc2626;
          font-size: 10.5px;
          line-height: 1;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .os-home-reminder-row h3 {
          margin: 0;
          color: #1d4ed8;
          font-size: 13.5px;
          line-height: 1.3;
          font-weight: 900;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.15s ease;
        }

        .os-home-reminder-row:hover h3 {
          color: #ea580c;
        }

        .os-home-reminder-row strong {
          color: #dc2626;
          font-size: 11.5px;
          line-height: 1;
          font-weight: 950;
          white-space: nowrap;
        }

        @media (max-width: 980px) {
          .os-board-container {
            width: min(100% - 24px, 1180px);
            padding-top: 18px;
          }

          .os-board-top h1 {
            font-size: 25px;
          }

          .os-latest-tile-grid,
          .os-important-info-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            padding: 12px;
          }

          .os-important-info-row {
            grid-template-columns: 1fr;
          }

          .os-home-main-layout,
          .os-home-bottom-layout {
            grid-template-columns: 1fr;
          }

          .os-home-right-column {
            position: static;
          }

          .os-home-update-comparison {
            grid-template-columns: 1fr;
          }

          .os-home-jobs-panel .os-home-update-row,
          .os-home-bottom-schemes .os-home-scheme-row {
            flex: initial;
          }
        }

        @media (max-width: 620px) {
          .os-latest-tile-grid,
          .os-important-info-grid {
            grid-template-columns: 1fr;
          }

          .os-latest-tile {
            min-height: 90px;
          }

          .os-board-top h1 {
            font-size: 22px;
          }
        }
      `}</style>
    </main>
  );
}
