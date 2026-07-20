export type VacancyCategoryRow = {
  id: string;
  category: string;
  total: string;
  male: string;
  female: string;
};

export type AgeCriteriaRow = {
  id: string;
  category: string;
  minimumAge: string;
  maximumAge: string;
  relaxation: string;
};

export type RequiredDocumentRow = {
  id: string;
  name: string;
  required: boolean;
  custom?: boolean;
};

export type JobFeeRow = {
  id: string;
  postName: string;
  category: string;
  fee: string;
  remarks: string;
};

export type JobInfoPanel = {
  id: string;
  organization: string;
  postName: string;
  totalVacancy: string;
  qualification: string;
  ageLimit: string;
  ageCutoffDate: string;
  salary: string;
  vacancyCategories: VacancyCategoryRow[];
  ageCriteria: AgeCriteriaRow[];
};

export const DEFAULT_VACANCY_CATEGORIES = [
  "Unreserved",
  "OBC/SEBC",
  "SC",
  "ST",
  "PH",
];

export const REQUIRED_JOB_DOCUMENTS = [
  "Aadhaar Card",
  "Photograph",
  "Signature",
  "10th Certificate",
  "10th Marksheet",
];

export const OPTIONAL_JOB_DOCUMENTS = [
  "12th Certificate",
  "12th Marksheet",
  "Bachelor's Degree Certificate",
  "Bachelor's Degree Marksheet",
  "Diploma Certificate",
  "Diploma Marksheet",
  "Postgraduate Certificate",
  "Postgraduate Marksheet",
];

export function createJobDetailId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createVacancyRow(category = ""): VacancyCategoryRow {
  return {
    id: createJobDetailId("vacancy"),
    category,
    total: "",
    male: "",
    female: "",
  };
}

export function createAgeCriteriaRow(category = ""): AgeCriteriaRow {
  return {
    id: createJobDetailId("age"),
    category,
    minimumAge: "",
    maximumAge: "",
    relaxation: "",
  };
}

export function createRequiredDocument(
  name: string,
  required: boolean,
  custom = false
): RequiredDocumentRow {
  return {
    id: createJobDetailId("document"),
    name,
    required,
    custom,
  };
}

export function createDefaultJobDocuments() {
  return REQUIRED_JOB_DOCUMENTS.map((name) =>
    createRequiredDocument(name, true)
  );
}

export function createJobFeeRow(): JobFeeRow {
  return {
    id: createJobDetailId("fee"),
    postName: "",
    category: "",
    fee: "",
    remarks: "",
  };
}

export function createJobInfoPanel(): JobInfoPanel {
  return {
    id: createJobDetailId("panel"),
    organization: "",
    postName: "",
    totalVacancy: "",
    qualification: "",
    ageLimit: "",
    ageCutoffDate: "",
    salary: "",
    vacancyCategories: DEFAULT_VACANCY_CATEGORIES.map(createVacancyRow),
    ageCriteria: [],
  };
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeVacancyRows(value: unknown): VacancyCategoryRow[] {
  const savedRows = Array.isArray(value)
    ? value.map((item: any, index) => ({
        id: item?.id || createJobDetailId(`vacancy_${index}`),
        category: cleanString(item?.category || item?.label),
        total: cleanString(item?.total || item?.totalVacancy),
        male: cleanString(item?.male || item?.maleVacancy),
        female: cleanString(item?.female || item?.femaleVacancy),
      }))
    : [];

  const defaultRows = DEFAULT_VACANCY_CATEGORIES.map((category) => {
    return (
      savedRows.find(
        (row) => row.category.toLowerCase() === category.toLowerCase()
      ) || createVacancyRow(category)
    );
  });
  const customRows = savedRows.filter(
    (row) =>
      !DEFAULT_VACANCY_CATEGORIES.some(
        (category) => category.toLowerCase() === row.category.toLowerCase()
      )
  );

  return [...defaultRows, ...customRows];
}

function normalizeAgeRows(value: unknown): AgeCriteriaRow[] {
  if (!Array.isArray(value)) return [];

  return value.map((item: any, index) => ({
    id: item?.id || createJobDetailId(`age_${index}`),
    category: cleanString(item?.category || item?.label),
    minimumAge: cleanString(item?.minimumAge || item?.minAge),
    maximumAge: cleanString(item?.maximumAge || item?.maxAge),
    relaxation: cleanString(item?.relaxation || item?.remarks || item?.note),
  }));
}

function normalizeDocuments(value: unknown): RequiredDocumentRow[] {
  const savedRows = Array.isArray(value)
    ? value
        .map((item: any, index) => {
          if (typeof item === "string") {
            return createRequiredDocument(item.trim(), true, false);
          }

          return {
            id: item?.id || createJobDetailId(`document_${index}`),
            name: cleanString(item?.name || item?.label),
            required: item?.required !== false,
            custom: Boolean(item?.custom),
          };
        })
        .filter((item) => item.name)
    : [];

  const uniqueSavedRows = savedRows.filter(
    (item, index, rows) =>
      rows.findIndex(
        (candidate) => candidate.name.toLowerCase() === item.name.toLowerCase()
      ) === index
  );

  const savedNames = new Set(
    uniqueSavedRows.map((item) => item.name.toLowerCase())
  );

  const missingMandatory = REQUIRED_JOB_DOCUMENTS.filter(
    (name) => !savedNames.has(name.toLowerCase())
  ).map((name) => createRequiredDocument(name, true));

  return [...missingMandatory, ...uniqueSavedRows];
}

export function normalizeJobDocuments(data: any): RequiredDocumentRow[] {
  const directDocuments = [data?.documentsRequired, data?.requiredDocuments].find(
    (value) => Array.isArray(value) && value.length > 0
  );

  if (Array.isArray(directDocuments) && directDocuments.length > 0) {
    return normalizeDocuments(directDocuments);
  }

  const legacyPanelDocuments = Array.isArray(data?.jobInfoPanels)
    ? data.jobInfoPanels.flatMap((panel: any) =>
        Array.isArray(panel?.documentsRequired)
          ? panel.documentsRequired
          : Array.isArray(panel?.requiredDocuments)
          ? panel.requiredDocuments
          : []
      )
    : [];

  return normalizeDocuments(legacyPanelDocuments);
}

export function cleanJobDocuments(rows: RequiredDocumentRow[]) {
  return normalizeDocuments(rows)
    .map((item) => ({
      ...item,
      name: item.name.trim(),
    }))
    .filter((item) => item.name && item.required);
}

function normalizeFeeRow(item: any, index: number): JobFeeRow {
  if (typeof item === "string") {
    return {
      ...createJobFeeRow(),
      postName: "All Posts",
      fee: item.trim(),
    };
  }

  return {
    id: item?.id || createJobDetailId(`fee_${index}`),
    postName: cleanString(
      item?.postName || item?.vacancyName || item?.designation
    ),
    category: cleanString(
      item?.category || item?.applicantCategory || item?.feeCategory
    ),
    fee: cleanString(
      item?.fee || item?.amount || item?.applicationFee || item?.value
    ),
    remarks: cleanString(item?.remarks || item?.note || item?.details),
  };
}

export function normalizeJobFeeRows(data: any): JobFeeRow[] {
  const directRows = [
    data?.feeStructureRows,
    data?.applicationFeeRows,
    data?.feeRows,
  ].find((value) => Array.isArray(value) && value.length > 0);

  if (Array.isArray(directRows)) {
    return directRows
      .map(normalizeFeeRow)
      .filter((row) => row.fee || row.category || row.postName || row.remarks);
  }

  const legacyPanelRows = Array.isArray(data?.jobInfoPanels)
    ? data.jobInfoPanels
        .map((panel: any, index: number) => ({
          id: createJobDetailId(`fee_${index}`),
          postName: cleanString(panel?.postName) || "All Posts",
          category: "",
          fee: cleanString(
            panel?.feeStructure || panel?.applicationFee || panel?.fees
          ),
          remarks: "",
        }))
        .filter((row: JobFeeRow) => row.fee)
    : [];

  if (legacyPanelRows.length > 0) return legacyPanelRows;

  const legacyFee = cleanString(
    data?.feeStructure || data?.applicationFee || data?.fees
  );

  return legacyFee
    ? [{ ...createJobFeeRow(), postName: "All Posts", fee: legacyFee }]
    : [];
}

export function cleanJobFeeRows(rows: JobFeeRow[]) {
  return rows
    .map((row) => ({
      ...row,
      postName: row.postName.trim(),
      category: row.category.trim(),
      fee: row.fee.trim(),
      remarks: row.remarks.trim(),
    }))
    .filter((row) => row.fee);
}

function normalizePanel(item: any, fallback: any = {}): JobInfoPanel {
  return {
    id: item?.id || createJobDetailId("panel"),
    organization: cleanString(
      item?.organization || item?.department || fallback.organization
    ),
    postName: cleanString(item?.postName || fallback.postName),
    totalVacancy: cleanString(item?.totalVacancy || fallback.totalVacancy),
    qualification: cleanString(
      item?.qualification || item?.educationalQualification || fallback.qualification
    ),
    ageLimit: cleanString(item?.ageLimit || fallback.ageLimit),
    ageCutoffDate: cleanString(
      item?.ageCutoffDate || item?.ageAsOnDate || fallback.ageCutoffDate
    ),
    salary: cleanString(item?.salary || item?.payScale || fallback.salary),
    vacancyCategories: normalizeVacancyRows(
      item?.vacancyCategories || item?.categoryWiseVacancy
    ),
    ageCriteria: normalizeAgeRows(
      item?.ageCriteria || item?.categoryWiseAge || item?.ageRelaxations
    ),
  };
}

export function normalizeJobInfoPanels(data: any): JobInfoPanel[] {
  if (Array.isArray(data?.jobInfoPanels) && data.jobInfoPanels.length > 0) {
    return data.jobInfoPanels.map((item: any) => normalizePanel(item));
  }

  const fallback = {
    organization: data?.organization || data?.department || "",
    postName: data?.postName || "",
    totalVacancy: data?.totalVacancy || "",
    qualification: data?.qualification || "",
    ageLimit: data?.ageLimit || "",
    ageCutoffDate: data?.ageCutoffDate || "",
    salary: data?.salary || data?.payScale || "",
  };

  return [normalizePanel(fallback, fallback)];
}

function hasVacancyData(row: VacancyCategoryRow) {
  return Boolean(row.total.trim() || row.male.trim() || row.female.trim());
}

function hasAgeData(row: AgeCriteriaRow) {
  return Boolean(
    row.category.trim() &&
      (row.minimumAge.trim() ||
        row.maximumAge.trim() ||
        row.relaxation.trim())
  );
}

export function isJobInfoPanelFilled(panel: JobInfoPanel) {
  return Boolean(
    panel.organization.trim() ||
      panel.postName.trim() ||
      panel.totalVacancy.trim() ||
      panel.qualification.trim() ||
      panel.ageLimit.trim() ||
      panel.ageCutoffDate.trim() ||
      panel.salary.trim() ||
      panel.vacancyCategories.some(hasVacancyData) ||
      panel.ageCriteria.some(hasAgeData)
  );
}

export function cleanJobInfoPanels(panels: JobInfoPanel[]) {
  return panels.filter(isJobInfoPanelFilled).map((panel) => ({
    ...panel,
    organization: panel.organization.trim(),
    postName: panel.postName.trim(),
    totalVacancy: panel.totalVacancy.trim(),
    qualification: panel.qualification.trim(),
    ageLimit: panel.ageLimit.trim(),
    ageCutoffDate: panel.ageCutoffDate.trim(),
    salary: panel.salary.trim(),
    vacancyCategories: panel.vacancyCategories
      .map((row) => ({
        ...row,
        category: row.category.trim(),
        total: row.total.trim(),
        male: row.male.trim(),
        female: row.female.trim(),
      }))
      .filter((row) => row.category && hasVacancyData(row)),
    ageCriteria: panel.ageCriteria
      .map((row) => ({
        ...row,
        category: row.category.trim(),
        minimumAge: row.minimumAge.trim(),
        maximumAge: row.maximumAge.trim(),
        relaxation: row.relaxation.trim(),
      }))
      .filter(hasAgeData),
  }));
}
