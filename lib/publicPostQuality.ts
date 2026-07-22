type LoosePostRecord = Record<string, any>;

const HIDDEN_STATUSES = new Set(["draft", "archived", "hidden", "private"]);
const NON_DETAIL_CATEGORIES = new Set([
  "tool",
  "tools",
  "pdf-tool",
  "pdf-tools",
  "image-tool",
  "image-tools",
  "scheme-category",
]);

function normalizeText(value: unknown) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeKey(value: unknown) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hasUsableUrl(value: unknown) {
  const url = String(value || "").trim();
  return /^(https?:\/\/|\/)/i.test(url) && url !== "#";
}

function hasArrayValue(value: unknown, keys: string[]) {
  if (!Array.isArray(value)) return false;

  return value.some((item) => {
    if (typeof item === "string") return Boolean(item.trim());
    if (!item || typeof item !== "object") return false;

    return keys.some((key) => {
      const field = (item as LoosePostRecord)[key];
      return typeof field === "string" ? Boolean(field.trim()) : Boolean(field);
    });
  });
}

function getIdentityKeys(data: LoosePostRecord, id?: string) {
  return new Set(
    [id, data.slug, data.title, data.toolName, data.schemeName]
      .map(normalizeKey)
      .filter(Boolean)
  );
}

function getBodyText(data: LoosePostRecord) {
  return normalizeText(
    [
      data.description,
      data.content,
      data.shortDescription,
      data.excerpt,
      data.details,
      data.eligibility,
      data.benefits,
      data.examPattern,
      data.syllabus,
      data.selectionProcedure,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function hasStructuredDetails(data: LoosePostRecord) {
  const usefulArrays = [
    hasArrayValue(data.importantDates, ["value", "date", "dateText"]),
    hasArrayValue(data.importantLinks, ["url", "href", "link"]),
    hasArrayValue(data.quickInfoRows, ["value"]),
    hasArrayValue(data.quickInfoPanels, [
      "organization",
      "postName",
      "totalVacancy",
      "qualification",
      "salary",
    ]),
    hasArrayValue(data.jobInfoPanels, [
      "organization",
      "postName",
      "totalVacancy",
      "qualification",
      "salary",
    ]),
    hasArrayValue(data.contentSections, ["content"]),
  ].filter(Boolean).length;

  const usefulDirectFields = [
    data.organization,
    data.department,
    data.postName,
    data.totalVacancy,
    data.qualification,
    data.ageLimit,
    data.salary,
    data.payScale,
    data.notificationNumber,
  ].filter((value) => normalizeText(value)).length;

  const hasOfficialDestination = [
    data.sourceUrl,
    data.officialUrl,
    data.officialSite,
    data.applyUrl,
    data.notificationUrl,
  ].some(hasUsableUrl);

  return (
    usefulArrays >= 2 ||
    usefulDirectFields >= 3 ||
    (hasOfficialDestination && getBodyText(data).length >= 80)
  );
}

function isKnownIncompleteLegacyPost(data: LoosePostRecord, id?: string) {
  const identities = getIdentityKeys(data, id);
  const bodyText = getBodyText(data);
  const category = normalizeKey(data.category || data.toolCategory);

  const isLegacyTool =
    identities.has("pdf-to-word") || identities.has("image-to-pdf");

  if (isLegacyTool) {
    const toolUrl = data.toolUrl || data.externalUrl || data.url;
    return !hasUsableUrl(toolUrl) && bodyText.length < 120;
  }

  if (identities.has("osssc-new-job-vacancy")) {
    return bodyText.length < 120 && !hasStructuredDetails(data);
  }

  if (NON_DETAIL_CATEGORIES.has(category)) {
    return !hasUsableUrl(data.toolUrl || data.externalUrl || data.url);
  }

  return false;
}

export function isPublishedPublicPost(data: LoosePostRecord) {
  const status = normalizeText(data.status || "published");
  return data.published !== false && !HIDDEN_STATUSES.has(status);
}

export function isPublicListingPost(data: LoosePostRecord, id?: string) {
  const title = normalizeText(data.title || data.schemeName || data.toolName);

  return (
    Boolean(title) &&
    isPublishedPublicPost(data) &&
    !isKnownIncompleteLegacyPost(data, id)
  );
}

export function isPublicDetailPost(data: LoosePostRecord, id?: string) {
  const category = normalizeKey(data.category || data.toolCategory);
  const identities = getIdentityKeys(data, id);
  const isToolOnlyIdentity =
    identities.has("pdf-to-word") || identities.has("image-to-pdf");

  return (
    isPublicListingPost(data, id) &&
    !NON_DETAIL_CATEGORIES.has(category) &&
    !isToolOnlyIdentity
  );
}
