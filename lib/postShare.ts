type ShareDateRow = {
  type?: string;
  label?: string;
  value?: string;
};

type BuildPostShareMessageInput = {
  title: string;
  category: string;
  url: string;
  description?: string;
  importantDates?: ShareDateRow[];
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function findLastDate(rows: ShareDateRow[]) {
  const matched = rows.find((row) => {
    const label = `${row.type || ""} ${row.label || ""}`.toLowerCase();
    return /last date|closing date|application end|apply end|deadline|exam date/.test(
      label
    );
  });

  return {
    label: clean(matched?.label || matched?.type) || "Last Date",
    value: clean(matched?.value),
  };
}

function decorateDetailLine(line: string) {
  const normalized = line.toLowerCase();
  if (normalized.startsWith("application start")) return `🗓️ *${line}*`;
  if (normalized.startsWith("application end")) return `⏰ *${line}*`;
  if (normalized.startsWith("total posts")) return `👥 *${line}*`;
  if (normalized.startsWith("salary")) return `💰 *${line}*`;
  return `ℹ️ ${line}`;
}

export function buildPostShareMessage({
  title,
  category,
  url,
  description,
  importantDates = [],
}: BuildPostShareMessageInput) {
  const safeTitle = clean(title) || "Latest Update";
  const safeCategory = clean(category) || "Update";
  const lines = [
    `📢 *Odisha Sathi ${safeCategory} Update*`,
    "",
    `📌 *Post:* ${safeTitle}`,
    `🏷️ *Category:* ${safeCategory}`,
  ];

  const structuredDescriptionLines = clean(description)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) =>
      /^(application start|application end|total posts|salary)\s*:/i.test(line)
    );

  if (structuredDescriptionLines.length > 0) {
    lines.push(...structuredDescriptionLines.map(decorateDetailLine));
  } else {
    const lastDate = findLastDate(importantDates);
    if (lastDate.value) {
      lines.push(`⏰ *${lastDate.label}:* ${lastDate.value}`);
    }
  }

  lines.push(`🔗 *Details:* ${url}`);
  lines.push("");
  lines.push("📣 Share as much as possible.");
  lines.push("✅ Follow us for more details.");

  return lines.join("\n");
}

export function decorateShareMetadata(title: string, description: string) {
  const decoratedLines = clean(description)
    .split(/\s*•\s*|\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => decorateDetailLine(line).replace(/\*/g, ""));

  return {
    title: `📢 ${clean(title) || "Odisha Sathi Update"}`,
    description: decoratedLines.join(" • ") || `🏷️ Odisha Sathi Update`,
  };
}
