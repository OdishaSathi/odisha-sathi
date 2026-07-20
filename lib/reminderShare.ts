export type ReminderShareItem = {
  title: string;
  category: string;
  lastDate: string;
  url: string;
  dateLabel?: string;
};

export function getReminderPostUrl(url: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}reminder=1`;
}

export function buildLastDateReminderShareText(items: ReminderShareItem[]) {
  const lines = ["📢 *Odisha Sathi Last Date Reminder*", ""];

  items.forEach((item, index) => {
    lines.push(`📌 *Post:* ${item.title || "Latest Update"}`);
    lines.push(`🏷️ *Category:* ${item.category || "Update"}`);
    lines.push(
      `⏰ *${item.dateLabel || "Last Date"}:* ${
        item.lastDate || "Date not available"
      }`
    );
    lines.push(`🔗 *Details:* ${getReminderPostUrl(item.url)}`);

    if (index < items.length - 1) lines.push("");
  });

  lines.push("");
  lines.push("📣 Share as much as possible.");
  lines.push("✅ Follow us for more details.");

  return lines.join("\n");
}
