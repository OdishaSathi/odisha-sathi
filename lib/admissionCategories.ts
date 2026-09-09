export const DEFAULT_ADMISSION_SUBCATEGORIES = [
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

export function normalizeAdmissionCategoryKey(value?: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/&/g, "and")
    .replace(/admissions/g, "admission")
    .replace(/[^a-z0-9]/g, "");
}

export function isScholarshipAdmissionCategory(value?: string) {
  const key = normalizeAdmissionCategoryKey(value);
  return key.includes("scholarship") || key.includes("scholar");
}

export function getCanonicalAdmissionCategory(value?: string) {
  const cleanValue = String(value || "").trim();
  if (!cleanValue) return "";

  const key = normalizeAdmissionCategoryKey(cleanValue);

  if (
    key === "plus2admission" ||
    key === "plustwoadmission" ||
    key === "2admission"
  ) {
    return "+2 Admissions";
  }

  if (
    key === "plus3admission" ||
    key === "plusthreeadmission" ||
    key === "3admission"
  ) {
    return "+3 Admissions";
  }

  const fixed = DEFAULT_ADMISSION_SUBCATEGORIES.find(
    (item) => normalizeAdmissionCategoryKey(item) === key
  );

  return fixed || cleanValue;
}

export function cleanAdmissionCategoryList(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (!value || isScholarshipAdmissionCategory(value)) continue;
    const canonical = getCanonicalAdmissionCategory(value);
    const key = normalizeAdmissionCategoryKey(canonical);
    if (!canonical || !key || seen.has(key)) continue;
    seen.add(key);
    result.push(canonical);
  }

  return result;
}
