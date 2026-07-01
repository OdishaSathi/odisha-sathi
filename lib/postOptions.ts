export const DATE_TYPE_OPTIONS = [
  "Application Start Date",
  "Last Date",
  "Fee Payment Last Date",
  "Correction Date",
  "Admit Card Date",
  "Exam Date",
  "Result Date",
  "Interview Date",
  "Document Verification Date",
  "Counselling Date",
  "Certificate Verification Date",
  "Merit List Date",
  "Joining Date",
  "Custom",
];

export const LINK_TYPE_OPTIONS = [
  "Apply Online",
  "Official Notification",
  "Download Admit Card",
  "Check Result",
  "Official Website",
  "Syllabus",
  "Answer Key",
  "Merit List",
  "Login Link",
  "Registration Link",
  "Download PDF",
  "Check Status",
  "Correction Link",
  "Counselling Link",
  "Custom",
];

export const QUICK_INFO_TYPE_OPTIONS = [
  "Organization / Department",
  "Post Name",
  "Total Vacancy",
  "Qualification",
  "Age Limit",
  "Salary / Pay Scale",
  "Job Location",
  "Application Mode",
  "Exam Mode",
  "Multiple Posts",
  "Category Wise Vacancy",
  "Custom",
];

export type ImportantDateRow = {
  id: string;
  type: string;
  label: string;
  value: string;
};

export type ImportantLinkRow = {
  id: string;
  type: string;
  label: string;
  url: string;
};

export type QuickInfoRow = {
  id: string;
  type: string;
  label: string;
  value: string;
};

export function createRowId(): string {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyDateRow(): ImportantDateRow {
  return {
    id: createRowId(),
    type: "Application Start Date",
    label: "Application Start Date",
    value: "",
  };
}

export function createEmptyLinkRow(): ImportantLinkRow {
  return {
    id: createRowId(),
    type: "Apply Online",
    label: "Apply Online",
    url: "",
  };
}

export function createEmptyQuickInfoRow(): QuickInfoRow {
  return {
    id: createRowId(),
    type: "Organization / Department",
    label: "Organization / Department",
    value: "",
  };
}

export function createDefaultJobQuickInfoRows(): QuickInfoRow[] {
  return [
    {
      id: createRowId(),
      type: "Organization / Department",
      label: "Organization / Department",
      value: "",
    },
    {
      id: createRowId(),
      type: "Post Name",
      label: "Post Name",
      value: "",
    },
    {
      id: createRowId(),
      type: "Total Vacancy",
      label: "Total Vacancy",
      value: "",
    },
    {
      id: createRowId(),
      type: "Qualification",
      label: "Qualification",
      value: "",
    },
    {
      id: createRowId(),
      type: "Age Limit",
      label: "Age Limit",
      value: "",
    },
    {
      id: createRowId(),
      type: "Salary / Pay Scale",
      label: "Salary / Pay Scale",
      value: "",
    },
  ];
}

export function resolveRowLabel(type: string, customLabel: string): string {
  if (type === "Custom") {
    return customLabel.trim();
  }

  return type;
}

export function cleanImportantDates(
  rows: ImportantDateRow[]
): ImportantDateRow[] {
  return rows
    .map((row) => ({
      ...row,
      label: resolveRowLabel(row.type, row.label),
      value: row.value.trim(),
    }))
    .filter((row) => row.label.trim() || row.value.trim());
}

export function cleanImportantLinks(
  rows: ImportantLinkRow[]
): ImportantLinkRow[] {
  return rows
    .map((row) => ({
      ...row,
      label: resolveRowLabel(row.type, row.label),
      url: row.url.trim(),
    }))
    .filter((row) => row.label.trim() && row.url.trim());
}

export function cleanQuickInfoRows(rows: QuickInfoRow[]): QuickInfoRow[] {
  return rows
    .map((row) => ({
      ...row,
      label: resolveRowLabel(row.type, row.label),
      value: row.value.trim(),
    }))
    .filter((row) => row.label.trim() && row.value.trim());
}

export function getQuickInfoValue(
  rows: QuickInfoRow[],
  label: string
): string {
  const found = rows.find((row) => row.label === label || row.type === label);
  return found?.value || "";
}