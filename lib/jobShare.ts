type JobShareDateRow = {
  type?: string;
  label?: string;
  value?: string;
};

export type JobShareSummary = {
  postNames: string;
  applicationStartDate: string;
  applicationEndDate: string;
  totalPosts: string;
  salary: string;
  title: string;
  text: string;
  metadataDescription: string;
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueStrings(values: unknown[]) {
  return Array.from(
    new Set(values.map(cleanString).filter(Boolean))
  );
}

function getPostNames(data: any) {
  const panelNames = Array.isArray(data?.jobInfoPanels)
    ? data.jobInfoPanels.map((panel: any) => panel?.postName)
    : [];

  const names = uniqueStrings(panelNames);

  if (names.length > 0) return names.join(", ");

  return cleanString(data?.postName) || cleanString(data?.title) || "Job Vacancy";
}

function getDateRows(data: any): JobShareDateRow[] {
  return Array.isArray(data?.importantDates) ? data.importantDates : [];
}

function findDate(data: any, kind: "start" | "end") {
  const directCandidates =
    kind === "start"
      ? [
          data?.applicationStartDate,
          data?.applyStartDate,
          data?.startDate,
          data?.onlineStartDate,
        ]
      : [
          data?.applicationEndDate,
          data?.applyEndDate,
          data?.lastDate,
          data?.endDate,
          data?.closingDate,
        ];

  const directValue = directCandidates.map(cleanString).find(Boolean);
  if (directValue) return directValue;

  const rows = getDateRows(data);
  const keywords =
    kind === "start"
      ? ["application start", "apply start", "start date", "opening date"]
      : [
          "application end",
          "apply end",
          "last date",
          "closing date",
          "end date",
          "deadline",
        ];

  const matchedRow = rows.find((row) => {
    const label = `${row?.type || ""} ${row?.label || ""}`
      .replace(/[^a-z0-9]+/gi, " ")
      .toLowerCase()
      .trim();

    return keywords.some((keyword) => label.includes(keyword));
  });

  return cleanString(matchedRow?.value);
}

function toNumber(value: unknown) {
  const text = cleanString(value).replace(/,/g, "");
  const match = text.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.NaN;
}

function getTotalPosts(data: any) {
  const panels = Array.isArray(data?.jobInfoPanels) ? data.jobInfoPanels : [];
  const panelTotals: string[] = panels
    .map((panel: any) => {
      const savedTotal = cleanString(panel?.totalVacancy);
      if (savedTotal) return savedTotal;

      const categoryRows = Array.isArray(panel?.vacancyCategories)
        ? panel.vacancyCategories
        : [];
      const categoryTotals = categoryRows
        .map((row: any) => toNumber(row?.total))
        .filter((value: number) => Number.isFinite(value));

      return categoryTotals.length > 0
        ? String(categoryTotals.reduce((sum: number, value: number) => sum + value, 0))
        : "";
    })
    .filter(Boolean);

  if (panelTotals.length === 1) return panelTotals[0];

  if (panelTotals.length > 1) {
    const numbers = panelTotals.map(toNumber);
    if (numbers.every((value: number) => Number.isFinite(value))) {
      return String(
        numbers.reduce((sum: number, value: number) => sum + value, 0)
      );
    }

    return panelTotals.join(" + ");
  }

  return cleanString(data?.totalVacancy) || cleanString(data?.totalPosts);
}

function getSalary(data: any) {
  const panels = Array.isArray(data?.jobInfoPanels) ? data.jobInfoPanels : [];
  const entries = panels
    .map((panel: any) => ({
      postName: cleanString(panel?.postName),
      salary: cleanString(panel?.salary || panel?.payScale),
    }))
    .filter((entry: { salary: string }) => entry.salary);

  const salaries = uniqueStrings(entries.map((entry: any) => entry.salary));

  if (salaries.length === 1) return salaries[0];

  if (salaries.length > 1) {
    return entries
      .map((entry: any) =>
        entry.postName ? `${entry.postName}: ${entry.salary}` : entry.salary
      )
      .join("; ");
  }

  return cleanString(data?.salary || data?.payScale);
}

export function buildJobShareSummary(data: any): JobShareSummary {
  const postNames = getPostNames(data);
  const applicationStartDate = findDate(data, "start") || "Not announced";
  const applicationEndDate = findDate(data, "end") || "Not announced";
  const totalPosts = getTotalPosts(data) || "Not specified";
  const salary = getSalary(data);

  const detailLines = [
    `Application Start Date: ${applicationStartDate}`,
    `Application End Date: ${applicationEndDate}`,
    `Total Posts: ${totalPosts}`,
  ];

  if (salary) detailLines.push(`Salary: ${salary}`);

  return {
    postNames,
    applicationStartDate,
    applicationEndDate,
    totalPosts,
    salary,
    title: postNames,
    text: detailLines.join("\n"),
    metadataDescription: detailLines.join(" • "),
  };
}

function getYouTubeId(url: string) {
  const patterns = [
    /youtu\.be\/([^?&/]+)/,
    /youtube\.com\/watch\?v=([^?&/]+)/,
    /youtube\.com\/embed\/([^?&/]+)/,
    /youtube\.com\/shorts\/([^?&/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return "";
}

export function getJobShareThumbnail(data: any) {
  const imageUrls = Array.isArray(data?.imageUrls) ? data.imageUrls : [];
  const customImage = [
    data?.previewImageUrl,
    data?.imageUrl,
    data?.bannerImageUrl,
    data?.bannerUrl,
    data?.shareImage,
    data?.shareImageUrl,
    imageUrls[0],
  ]
    .map(cleanString)
    .find(Boolean);

  if (customImage) return customImage;

  const videoRows = [
    data?.youtubeUrl,
    ...(Array.isArray(data?.youtubeUrls) ? data.youtubeUrls : []),
    ...(Array.isArray(data?.youtubeVideos) ? data.youtubeVideos : []),
    ...(Array.isArray(data?.videos) ? data.videos : []),
  ];

  for (const item of videoRows) {
    const url = cleanString(
      typeof item === "string"
        ? item
        : item?.url || item?.youtubeUrl || item?.videoUrl
    );
    const videoId = getYouTubeId(url);
    if (videoId) return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  return "";
}
