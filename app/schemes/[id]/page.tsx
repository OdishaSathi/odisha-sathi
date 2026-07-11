"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import ReminderShareButtons from "@/components/public/ReminderShareButtons";

const SCHEME_COLLECTIONS = [
  "posts",
  "schemes",
  "scheme",
  "governmentSchemes",
  "government-schemes",
];

const POSTS_PER_PAGE = 30;

type ImportantDate = {
  label?: string;
  value?: string;
};

type SchemeCategoryOption = {
  label: string;
  value: string;
};

type SchemePost = {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  description?: string;
  category?: string;
  subCategory?: string;
  subCategories?: any[];
  schemeCategory?: string;
  schemeCategorySlug?: string;
  schemeSubCategory?: string;
  schemeSubCategorySlug?: string;
  schemeCategories?: any[];
  selectedSchemeCategory?: string;
  selectedSchemeCategorySlug?: string;
  selectedSchemeCategories?: any[];
  categoryName?: string;
  categorySlug?: string;
  subCategorySlug?: string;
  categories?: any[];
  schemeName?: string;
  department?: string;
  organization?: string;
  ministry?: string;
  benefit?: string;
  amountBenefit?: string;
  eligibility?: string;
  startDate?: string;
  startDateDisplay?: string;
  applicationStartDate?: string;
  applyStartDate?: string;
  schemeStartDate?: string;
  launchDate?: string;
  openingDate?: string;
  lastDate?: string;
  lastDateDisplay?: string;
  applicationLastDate?: string;
  applyLastDate?: string;
  schemeLastDate?: string;
  applicationEndDate?: string;
  closingDate?: string;
  endDate?: string;
  deadline?: string;
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

function normalizeText(value?: any) {
  return String(value || "").trim().toLowerCase();
}

function createSlug(value?: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCategoryWord(value?: string) {
  const word = String(value || "").trim().toLowerCase();

  if (!word) return "";

  if (word === "scholarships") return "scholarship";
  if (word === "schemes") return "scheme";
  if (word === "yojana" || word === "yojna") return "scheme";
  if (word === "government") return "govt";
  if (word === "students") return "student";
  if (word === "farmers") return "farmer";
  if (word === "women" || word === "woman" || word === "womens") return "women";
  if (word === "girls") return "girl";

  return word;
}

function getCategoryWords(value?: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/&/g, " and ")
    .replace(/[-_/]+/g, " ")
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .map((word) => normalizeCategoryWord(word))
    .filter(Boolean)
    .filter((word) => word !== "and");
}

function normalizeCategoryKey(value?: string) {
  return getCategoryWords(value).join("");
}

function getCoreCategoryWords(value?: string) {
  return getCategoryWords(value).filter((word) => {
    return !["scheme", "schemes", "govt", "government", "and"].includes(word);
  });
}

function isGenericSchemeMainCategory(value?: string) {
  const key = normalizeCategoryKey(value);

  return (
    key === "scheme" ||
    key === "govtscheme" ||
    key === "governmentscheme" ||
    key === "government" ||
    key === "govt"
  );
}

function getValueText(value: any) {
  if (!value) return "";

  if (typeof value === "string") return value.trim();

  if (typeof value === "number") return String(value);

  if (typeof value === "object") {
    return String(
      value.label ||
        value.name ||
        value.title ||
        value.value ||
        value.slug ||
        value.id ||
        ""
    ).trim();
  }

  return "";
}

function getOptionFromValue(value: any): SchemeCategoryOption | null {
  if (!value) return null;

  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();

    if (!text) return null;

    return {
      label: text,
      value: text,
    };
  }

  if (typeof value === "object") {
    const label = String(
      value.label || value.name || value.title || value.value || value.slug || value.id || ""
    ).trim();

    const optionValue = String(
      value.value || value.slug || value.id || value.label || value.name || value.title || ""
    ).trim();

    if (!label && !optionValue) return null;

    return {
      label: label || optionValue,
      value: optionValue || label,
    };
  }

  return null;
}

function getUniqueOptions(options: SchemeCategoryOption[]) {
  return Array.from(
    new Map(
      options
        .filter((item) => item.label && item.value)
        .map((item) => [normalizeCategoryKey(item.value), item])
    ).values()
  );
}

function getTimeValue(item: SchemePost) {
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

function getPublishedDate(item: SchemePost) {
  return formatDate(item.createdAt || item.publishedDate);
}

function getRawStartDate(item: SchemePost) {
  const directDate =
    item.startDateDisplay ||
    item.startDate ||
    item.applicationStartDate ||
    item.applyStartDate ||
    item.schemeStartDate ||
    item.launchDate ||
    item.openingDate ||
    "";

  if (directDate) return directDate;

  const matchedDate = item.importantDates?.find((dateItem) => {
    const label = normalizeText(dateItem.label);

    return (
      label.includes("start") ||
      label.includes("opening") ||
      label.includes("begin") ||
      label.includes("launch") ||
      label.includes("apply starts")
    );
  });

  return matchedDate?.value || "";
}

function getRawLastDate(item: SchemePost) {
  const directDate =
    item.lastDateDisplay ||
    item.lastDate ||
    item.applicationLastDate ||
    item.applyLastDate ||
    item.schemeLastDate ||
    item.applicationEndDate ||
    item.closingDate ||
    item.endDate ||
    item.deadline ||
    "";

  if (directDate) return directDate;

  const matchedDate = item.importantDates?.find((dateItem) => {
    const label = normalizeText(dateItem.label);

    return (
      label.includes("last") ||
      label.includes("closing") ||
      label.includes("end") ||
      label.includes("deadline")
    );
  });

  return matchedDate?.value || "";
}

function getStartDate(item: SchemePost) {
  return formatDate(getRawStartDate(item));
}

function getLastDate(item: SchemePost) {
  return formatDate(getRawLastDate(item));
}

function getSchemeTitle(item: SchemePost) {
  return item.schemeName || item.title || "Untitled Scheme";
}

function getShortDescription(item: SchemePost) {
  const text =
    item.description ||
    item.content ||
    item.benefit ||
    item.amountBenefit ||
    item.eligibility ||
    "";

  const cleanText = String(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanText) return "Scheme details will be available inside this update.";

  if (cleanText.length <= 150) return cleanText;

  return `${cleanText.slice(0, 150).trim()}...`;
}

function isSchemePost(item: SchemePost) {
  const category = normalizeText(item.category);
  const sourceCollection = normalizeText(item.sourceCollection);

  return (
    sourceCollection === "schemes" ||
    sourceCollection === "scheme" ||
    sourceCollection === "governmentschemes" ||
    sourceCollection === "government-schemes" ||
    category === "schemes" ||
    category === "scheme" ||
    category === "government schemes" ||
    category === "government-schemes" ||
    category === "govt schemes" ||
    category === "govt-schemes"
  );
}

function getSchemeCategoryOptions(item: SchemePost) {
  const options: SchemeCategoryOption[] = [];

  const addOption = (labelValue: any, routeValue?: any) => {
    const labelText = getValueText(labelValue);
    const routeText = getValueText(routeValue);

    if (!labelText && !routeText) return;

    options.push({
      label: labelText || routeText,
      value: routeText || labelText,
    });
  };

  if (item.category && !isGenericSchemeMainCategory(item.category)) {
    addOption(item.category);
  }

  addOption(item.schemeCategory, item.schemeCategorySlug || item.schemeCategory);
  addOption(item.schemeSubCategory, item.schemeSubCategorySlug || item.schemeSubCategory);
  addOption(item.selectedSchemeCategory, item.selectedSchemeCategorySlug || item.selectedSchemeCategory);
  addOption(item.subCategory);
  addOption(item.categoryName, item.categorySlug || item.categoryName);
  addOption(item.subCategorySlug);

  if (Array.isArray(item.schemeCategories)) {
    item.schemeCategories.forEach((value) => {
      const option = getOptionFromValue(value);
      if (option) options.push(option);
    });
  }

  if (Array.isArray(item.selectedSchemeCategories)) {
    item.selectedSchemeCategories.forEach((value) => {
      const option = getOptionFromValue(value);
      if (option) options.push(option);
    });
  }

  if (Array.isArray(item.subCategories)) {
    item.subCategories.forEach((value) => {
      const option = getOptionFromValue(value);
      if (option) options.push(option);
    });
  }

  if (Array.isArray(item.categories)) {
    item.categories.forEach((value) => {
      const option = getOptionFromValue(value);
      if (option) options.push(option);
    });
  }

  return getUniqueOptions(options);
}

function getCategoryMatchKeys(value?: string) {
  const text = String(value || "").trim();
  const words = getCategoryWords(text);
  const coreWords = getCoreCategoryWords(text);
  const slug = createSlug(text);

  return Array.from(
    new Set(
      [
        text,
        slug,
        normalizeCategoryKey(text),
        words.join(""),
        coreWords.join(""),
        coreWords.slice(0, 2).join(""),
      ]
        .filter(Boolean)
        .map((item) => normalizeCategoryKey(item))
        .filter(Boolean)
    )
  );
}

function getCoreCategorySearchWords(value?: string) {
  return getCoreCategoryWords(value).filter((word) => word.length >= 3);
}

function schemeMatchesSelectedCategory(
  item: SchemePost,
  selectedCategory: string
) {
  const selectedKeys = getCategoryMatchKeys(selectedCategory);

  if (selectedKeys.length === 0) return false;

  const postCategoryOptions = getSchemeCategoryOptions(item);

  if (postCategoryOptions.length > 0) {
    return postCategoryOptions.some((option) => {
      const optionKeys = [
        ...getCategoryMatchKeys(option.label),
        ...getCategoryMatchKeys(option.value),
      ];

      return optionKeys.some((key) => selectedKeys.includes(key));
    });
  }

  const fallbackWords = getCoreCategorySearchWords(selectedCategory);

  if (fallbackWords.length === 0) return false;

  const searchableText = normalizeCategoryKey(
    [
      item.title,
      item.schemeName,
      item.content,
      item.description,
      item.department,
      item.organization,
      item.ministry,
      item.benefit,
      item.amountBenefit,
      item.eligibility,
    ]
      .filter(Boolean)
      .join(" ")
  );

  return fallbackWords.every((word) => searchableText.includes(word));
}

function isDeadlineWithinNext7Days(item: SchemePost) {
  const lastDate = parseDateValue(
    item.lastDate ||
      item.applicationLastDate ||
      item.applyLastDate ||
      item.schemeLastDate ||
      item.applicationEndDate ||
      item.closingDate ||
      item.endDate ||
      item.deadline ||
      getRawLastDate(item)
  );

  if (!lastDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextSevenDays = new Date(today);
  nextSevenDays.setDate(today.getDate() + 7);

  return lastDate >= today && lastDate <= nextSevenDays;
}

function getSchemeKey(item: SchemePost) {
  return item.slug || item.id;
}

function getCardCategoriesText(item: SchemePost) {
  const categories = getSchemeCategoryOptions(item).map((option) => option.label);

  if (categories.length === 0) return "No subcategory added";

  return categories.join(", ");
}

function SchemeTile({ scheme, index }: { scheme: SchemePost; index: number }) {
  const publishedDate = getPublishedDate(scheme);
  const startDate = getStartDate(scheme);
  const lastDate = getLastDate(scheme);
  const categoriesText = getCardCategoriesText(scheme);
  const description = getShortDescription(scheme);

  return (
    <Link
      href={`/post/${scheme.slug || scheme.id}`}
      className={`os-scheme-long-card os-scheme-long-color-${index % 8}`}
    >
      <div className="os-scheme-long-main">
        <span className="os-scheme-category-pill">{categoriesText}</span>

        <h2>{getSchemeTitle(scheme)}</h2>

        <p>{description}</p>
      </div>

      <div className="os-scheme-long-dates">
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

function ReminderItem({ scheme }: { scheme: SchemePost }) {
  const lastDate = getLastDate(scheme);

  return (
    <Link
      href={`/post/${scheme.slug || scheme.id}`}
      className="os-reminder-item"
    >
      <span>{getSchemeTitle(scheme)}</span>
      {lastDate ? <strong>Last Date: {lastDate}</strong> : null}
    </Link>
  );
}

function buildReminderShareText(reminderSchemes: SchemePost[], origin: string) {
  const lines: string[] = ["Odisha Sathi Last Date Reminder", ""];

  reminderSchemes.forEach((scheme, index) => {
    const title = getSchemeTitle(scheme);
    const lastDate = getLastDate(scheme) || "Date not available";
    const postLink = `${origin}/post/${scheme.slug || scheme.id}`;

    lines.push(title);
    lines.push(`Last Date: ${lastDate}`);
    lines.push(postLink);

    if (index < reminderSchemes.length - 1) {
      lines.push("");
    }
  });

  return lines.join("\n");
}

export default function SchemeCategoryPage() {
  const params = useParams();

  const categoryName =
    getSafeParamValue(params.subCategory as string | string[] | undefined) ||
    getSafeParamValue(params.category as string | string[] | undefined) ||
    getSafeParamValue(params.id as string | string[] | undefined) ||
    getSafeParamValue(params.slug as string | string[] | undefined);

  const [schemes, setSchemes] = useState<SchemePost[]>([]);
  const [availableCategories, setAvailableCategories] = useState<
    SchemeCategoryOption[]
  >([]);
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [loading, setLoading] = useState(true);

  const visibleSchemes = schemes.slice(0, visibleCount);
  const canViewMore = visibleCount < schemes.length;

  const sideCategories = useMemo(() => {
    return getUniqueOptions(availableCategories).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [availableCategories]);

  const reminderSchemes = schemes
    .filter((scheme) => isDeadlineWithinNext7Days(scheme))
    .sort((a, b) => {
      const dateA = parseDateValue(getRawLastDate(a))?.getTime() || 0;
      const dateB = parseDateValue(getRawLastDate(b))?.getTime() || 0;

      return dateA - dateB;
    });

  const handleShareReminder = () => {
    if (reminderSchemes.length === 0) return;

    const shareText = buildReminderShareText(
      reminderSchemes,
      window.location.origin
    );

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    const loadSchemes = async () => {
      try {
        setLoading(true);

        const allSchemes: SchemePost[] = [];

        for (const collectionName of SCHEME_COLLECTIONS) {
          const snapshot = await getDocs(collection(db, collectionName));

          snapshot.docs.forEach((docItem) => {
            const data = docItem.data();

            allSchemes.push({
              id: docItem.id,
              title: data.title || data.schemeName || "",
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
              schemeCategory:
                data.schemeCategory ||
                data.schemeSubCategory ||
                data.selectedSchemeCategory ||
                "",
              schemeCategorySlug:
                data.schemeCategorySlug ||
                data.schemeSubCategorySlug ||
                data.selectedSchemeCategorySlug ||
                "",
              schemeSubCategory: data.schemeSubCategory || "",
              schemeSubCategorySlug: data.schemeSubCategorySlug || "",
              schemeCategories: Array.isArray(data.schemeCategories)
                ? data.schemeCategories
                : [],
              selectedSchemeCategory: data.selectedSchemeCategory || "",
              selectedSchemeCategorySlug: data.selectedSchemeCategorySlug || "",
              selectedSchemeCategories: Array.isArray(data.selectedSchemeCategories)
                ? data.selectedSchemeCategories
                : [],
              categoryName: data.categoryName || "",
              categorySlug: data.categorySlug || "",
              subCategorySlug: data.subCategorySlug || "",
              categories: Array.isArray(data.categories) ? data.categories : [],
              schemeName: data.schemeName || "",
              department: data.department || "",
              organization: data.organization || "",
              ministry: data.ministry || "",
              benefit: data.benefit || "",
              amountBenefit: data.amountBenefit || "",
              eligibility: data.eligibility || "",
              startDateDisplay: data.startDateDisplay || "",
              startDate:
                data.startDate ||
                data.applicationStartDate ||
                data.applyStartDate ||
                data.schemeStartDate ||
                data.launchDate ||
                data.openingDate ||
                "",
              applicationStartDate: data.applicationStartDate || "",
              applyStartDate: data.applyStartDate || "",
              schemeStartDate: data.schemeStartDate || "",
              launchDate: data.launchDate || "",
              openingDate: data.openingDate || "",
              lastDateDisplay: data.lastDateDisplay || "",
              lastDate:
                data.lastDate ||
                data.applicationLastDate ||
                data.applyLastDate ||
                data.schemeLastDate ||
                data.applicationEndDate ||
                data.closingDate ||
                data.endDate ||
                data.deadline ||
                "",
              applicationLastDate: data.applicationLastDate || "",
              applyLastDate: data.applyLastDate || "",
              schemeLastDate: data.schemeLastDate || "",
              applicationEndDate: data.applicationEndDate || "",
              closingDate: data.closingDate || "",
              endDate: data.endDate || "",
              deadline: data.deadline || "",
              publishedDate: data.publishedDate || "",
              importantDates: data.importantDates || [],
              published: data.published,
              createdAt: data.createdAt || null,
              sourceCollection: collectionName,
            });
          });
        }

        const validSchemes = Array.from(
          new Map(
            allSchemes
              .filter((item) => {
                if (item.published === false) return false;

                return (
                  isSchemePost(item) ||
                  schemeMatchesSelectedCategory(item, categoryName)
                );
              })
              .map((item) => [getSchemeKey(item), item])
          ).values()
        );

        const discoveredCategories = getUniqueOptions(
          validSchemes.flatMap((item) => getSchemeCategoryOptions(item))
        ).sort((a, b) => a.label.localeCompare(b.label));

        const filteredSchemes = validSchemes
          .filter((item) => schemeMatchesSelectedCategory(item, categoryName))
          .sort((a, b) => getTimeValue(b) - getTimeValue(a));

        setAvailableCategories(discoveredCategories);
        setSchemes(filteredSchemes);
        setVisibleCount(POSTS_PER_PAGE);
      } catch (error) {
        console.error(error);
        alert("Failed to load schemes");
      } finally {
        setLoading(false);
      }
    };

    loadSchemes();
  }, [categoryName]);

  return (
    <main className="os-scheme-category-page">
      <div className="os-scheme-category-container">
        <section className="os-scheme-category-top">
          <Link href="/schemes" className="os-back-link">
            ← Back to Schemes
          </Link>

          <p>ODISHA SATHI SCHEMES</p>
          <h1>{categoryName}</h1>
          <span>
            Showing scheme updates assigned to this selected scheme category.
          </span>
        </section>

        <section className="os-scheme-category-layout">
          <div className="os-scheme-category-main">
            <section className="os-list-section">
              <div className="os-list-section-head">
                <h2>{categoryName}</h2>
              </div>

              {loading ? (
                <p className="os-list-status">Loading schemes...</p>
              ) : schemes.length === 0 ? (
                <p className="os-list-status">
                  No schemes found in this category.
                </p>
              ) : (
                <>
                  <div className="os-scheme-long-list">
                    {visibleSchemes.map((scheme, index) => (
                      <SchemeTile
                        key={scheme.id}
                        scheme={scheme}
                        index={index}
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

          <aside className="os-scheme-category-sidebar">
            <section className="os-side-card">
              <h2>Scheme Categories</h2>

              <div className="os-side-category-list">
                {sideCategories.length === 0 ? (
                  <p className="os-side-status">No categories found.</p>
                ) : (
                  sideCategories.map((item) => (
                    <Link
                      key={item.value}
                      href={`/schemes/${encodeURIComponent(item.value)}`}
                      className={
                        getCategoryMatchKeys(item.value).some((key) =>
                          getCategoryMatchKeys(categoryName).includes(key)
                        )
                          ? "os-active-category"
                          : ""
                      }
                    >
                      {item.label}
                    </Link>
                  ))
                )}
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
                    buildReminderShareText(reminderSchemes, window.location.origin)
                  }
                  disabled={loading || reminderSchemes.length === 0}
                  label="Last Date Reminder"
                />
              </div>

              {loading ? (
                <p className="os-side-status">Loading reminders...</p>
              ) : reminderSchemes.length === 0 ? (
                <p className="os-side-status">
                  No scheme deadline in this category within the next 7 days.
                </p>
              ) : (
                <div className="os-reminder-list">
                  {reminderSchemes.map((scheme) => (
                    <ReminderItem key={scheme.id} scheme={scheme} />
                  ))}
                </div>
              )}
            </section>
          </aside>
        </section>
      </div>

      <style jsx global>{`
        .os-scheme-category-page {
          min-height: 100vh;
          background: #ffffff;
          color: #0f172a;
        }

        .os-scheme-category-container {
          width: min(100% - 32px, 1180px);
          margin: 0 auto;
          padding: 22px 0 42px;
        }

        .os-scheme-category-top {
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

        .os-scheme-category-top p {
          margin: 0 0 8px;
          color: #c2410c;
          font-size: 13px;
          line-height: 1.35;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .os-scheme-category-top h1 {
          margin: 0;
          color: #0f172a;
          font-size: clamp(25px, 4vw, 38px);
          line-height: 1.12;
          font-weight: 950;
          letter-spacing: -0.045em;
        }

        .os-scheme-category-top span {
          display: block;
          margin-top: 8px;
          color: #64748b;
          font-size: 15px;
          line-height: 1.45;
          font-weight: 700;
        }

        .os-scheme-category-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 18px;
          align-items: start;
        }

        .os-scheme-category-main {
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

        .os-scheme-long-list {
          display: grid;
          gap: 14px;
          padding: 14px;
        }

        .os-scheme-long-card {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 220px;
          gap: 16px;
          min-height: 142px;
          padding: 18px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 14px;
          text-decoration: none;
          color: #0f172a;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            border-color 0.18s ease;
        }

        .os-scheme-long-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 30px rgba(15, 23, 42, 0.1);
          border-color: rgba(234, 88, 12, 0.25);
        }

        .os-scheme-long-main {
          min-width: 0;
        }

        .os-scheme-category-pill {
          display: inline-flex;
          max-width: 100%;
          margin-bottom: 9px;
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.65);
          color: #334155;
          font-size: 12px;
          line-height: 1.25;
          font-weight: 900;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .os-scheme-long-card h2 {
          margin: 0;
          color: #0f172a;
          font-size: 21px;
          line-height: 1.25;
          font-weight: 950;
          letter-spacing: -0.03em;
        }

        .os-scheme-long-card:hover h2 {
          color: #ea580c;
        }

        .os-scheme-long-card p {
          margin: 9px 0 0;
          color: #334155;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 750;
        }

        .os-scheme-long-dates {
          display: grid;
          gap: 7px;
          align-content: center;
          justify-items: end;
        }

        .os-scheme-long-dates span {
          color: #475569;
          font-size: 12.5px;
          line-height: 1.2;
          font-weight: 900;
          text-align: right;
        }

        .os-scheme-long-dates .os-date-green {
          color: #166534;
        }

        .os-scheme-long-dates .os-date-red {
          color: #dc2626;
        }

        .os-scheme-long-color-0 {
          background: linear-gradient(135deg, #fff7ed, #fed7aa);
        }

        .os-scheme-long-color-1 {
          background: linear-gradient(135deg, #eff6ff, #bfdbfe);
        }

        .os-scheme-long-color-2 {
          background: linear-gradient(135deg, #ecfdf5, #86efac);
        }

        .os-scheme-long-color-3 {
          background: linear-gradient(135deg, #fff1f2, #fecdd3);
        }

        .os-scheme-long-color-4 {
          background: linear-gradient(135deg, #f5f3ff, #ddd6fe);
        }

        .os-scheme-long-color-5 {
          background: linear-gradient(135deg, #fefce8, #fde68a);
        }

        .os-scheme-long-color-6 {
          background: linear-gradient(135deg, #ecfeff, #a5f3fc);
        }

        .os-scheme-long-color-7 {
          background: linear-gradient(135deg, #fdf2f8, #fbcfe8);
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

        .os-scheme-category-sidebar {
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
          .os-scheme-long-card {
            grid-template-columns: 1fr;
          }

          .os-scheme-long-dates {
            justify-items: start;
          }

          .os-scheme-long-dates span {
            text-align: left;
          }
        }

        @media (max-width: 900px) {
          .os-scheme-category-container {
            width: min(100% - 24px, 1180px);
            padding-top: 18px;
          }

          .os-scheme-category-top p {
            font-size: 12px;
          }

          .os-scheme-category-layout {
            grid-template-columns: 1fr;
          }

          .os-scheme-category-sidebar {
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
          .os-scheme-long-list {
            padding: 12px;
          }

          .os-scheme-long-card {
            min-height: 126px;
            padding: 15px;
          }

          .os-scheme-long-card h2 {
            font-size: 18px;
          }

          .os-scheme-category-pill {
            white-space: normal;
          }
        }
      `}</style>
    </main>
  );
}
