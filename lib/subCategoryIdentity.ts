export function cleanSubCategoryValue(value: unknown) {
  return String(value || "").trim();
}

export function makeCanonicalSubCategorySlug(value: unknown) {
  let text = cleanSubCategoryValue(value)
    .replace(/^\+2\b/i, "plus-two")
    .replace(/^\+3\b/i, "plus-three")
    .replace(/\bB\.\s*Ed\b/gi, "BEd");

  text = text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return text
    .replace(/^plus-2\b/, "plus-two")
    .replace(/^plus-3\b/, "plus-three");
}

export function makeCanonicalSubCategorySlugs(values: unknown[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const slug = makeCanonicalSubCategorySlug(value);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    result.push(slug);
  }

  return result;
}

export function getRecordSubCategoryValues(record: {
  subCategory?: unknown;
  subCategoryLabel?: unknown;
  subCategories?: unknown;
  subCategorySlugs?: unknown;
}) {
  const values = [
    ...(Array.isArray(record.subCategorySlugs)
      ? record.subCategorySlugs
      : []),
    ...(Array.isArray(record.subCategories) ? record.subCategories : []),
    record.subCategory,
    record.subCategoryLabel,
  ];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const text = cleanSubCategoryValue(value);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }

  return result;
}
