type CategoryInfo = {
  label: string;
  heading: string;
  subtitle: string;
  startColor: string;
  endColor: string;
};

const CATEGORY_INFO: Record<string, CategoryInfo> = {
  jobs: {
    label: "Latest Jobs",
    heading: "ODISHA SATHI JOB UPDATE",
    subtitle: "Jobs • Exams • Results • Admissions • Schemes",
    startColor: "#1d4ed8",
    endColor: "#0f172a",
  },
  "admit-cards": {
    label: "Admit Cards",
    heading: "ODISHA SATHI ADMIT CARD UPDATE",
    subtitle: "Download Admit Card • Exam Date • Official Link",
    startColor: "#7c3aed",
    endColor: "#111827",
  },
  results: {
    label: "Results",
    heading: "ODISHA SATHI RESULT UPDATE",
    subtitle: "Result • Merit List • Official Link",
    startColor: "#15803d",
    endColor: "#052e16",
  },
  admissions: {
    label: "Admissions",
    heading: "ODISHA SATHI ADMISSION UPDATE",
    subtitle: "Admission • Dates • Apply Link",
    startColor: "#ea580c",
    endColor: "#431407",
  },
  exams: {
    label: "Exams",
    heading: "ODISHA SATHI EXAM UPDATE",
    subtitle: "Exam • Syllabus • Admit Card • Result",
    startColor: "#0891b2",
    endColor: "#083344",
  },
  schemes: {
    label: "Govt Schemes",
    heading: "ODISHA SATHI GOVT SCHEME UPDATE",
    subtitle: "Scheme • Eligibility • Apply Link",
    startColor: "#be123c",
    endColor: "#450a0a",
  },
  scholarships: {
    label: "Scholarships",
    heading: "ODISHA SATHI SCHOLARSHIP UPDATE",
    subtitle: "Scholarship • Eligibility • Apply Link",
    startColor: "#ca8a04",
    endColor: "#422006",
  },
};

export function normalizeCategorySlug(category?: string | null): string {
  if (!category) return "jobs";

  return category
    .toLowerCase()
    .trim()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
}

export function getCategoryLabel(category?: string | null): string {
  const slug = normalizeCategorySlug(category);
  return CATEGORY_INFO[slug]?.label || "Odisha Sathi Update";
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number) {
  const cleanText = text.replace(/\s+/g, " ").trim();

  if (!cleanText) {
    return [];
  }

  const words = cleanText.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxCharsPerLine) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word);
        currentLine = "";
      }
    } else {
      currentLine = nextLine;
    }

    if (lines.length >= maxLines) {
      break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}

export function getDefaultCategoryPreviewImage(
  category?: string | null,
  shortDescription?: string | null
): string {
  const slug = normalizeCategorySlug(category);

  const info = CATEGORY_INFO[slug] || {
    label: "Odisha Sathi",
    heading: "ODISHA SATHI UPDATE",
    subtitle: "Latest Update",
    startColor: "#2563eb",
    endColor: "#0f172a",
  };

  const descriptionLines = wrapText(shortDescription || "", 54, 5);

  const descriptionSvg =
    descriptionLines.length > 0
      ? descriptionLines
          .map((line, index) => {
            const y = 330 + index * 42;

            return `<text x="600" y="${y}" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="32" font-weight="700">${escapeSvgText(
              line
            )}</text>`;
          })
          .join("")
      : `<text x="600" y="350" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="36" font-weight="700">${escapeSvgText(
          info.label
        )}</text>`;

  const svg = `
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${info.startColor}"/>
        <stop offset="100%" stop-color="${info.endColor}"/>
      </linearGradient>
    </defs>

    <rect width="1200" height="630" fill="url(#bg)"/>

    <circle cx="1080" cy="90" r="175" fill="rgba(255,255,255,0.08)"/>
    <circle cx="110" cy="560" r="190" fill="rgba(255,255,255,0.07)"/>

    <rect x="70" y="70" width="1060" height="490" rx="38" fill="rgba(255,255,255,0.11)" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>

    <text x="600" y="160" text-anchor="middle" fill="#dbeafe" font-family="Arial, sans-serif" font-size="30" font-weight="800">ODISHA SATHI</text>

    <text x="600" y="235" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="58" font-weight="900">${escapeSvgText(
      info.heading
    )}</text>

    ${descriptionSvg}

    <rect x="360" y="505" width="480" height="54" rx="27" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.22)" stroke-width="1"/>

    <text x="600" y="540" text-anchor="middle" fill="#dbeafe" font-family="Arial, sans-serif" font-size="24" font-weight="700">${escapeSvgText(
      info.subtitle
    )}</text>
  </svg>
  `;

  return svgToDataUri(svg);
}