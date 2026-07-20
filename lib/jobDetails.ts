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
  documentsRequired: RequiredDocumentRow[];
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

function createMandatoryDocuments() {
  return REQUIRED_JOB_DOCUMENTS.map((name) =>
    createRequiredDocument(name, true)
  );
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
    documentsRequired: createMandatoryDocuments(),
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

  const savedNames = new Set(
    savedRows.map((item) => item.name.toLowerCase())
  );

  const missingMandatory = REQUIRED_JOB_DOCUMENTS.filter(
    (name) => !savedNames.has(name.toLowerCase())
  ).map((name) => createRequiredDocument(name, true));

  return [...missingMandatory, ...savedRows];
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
    documentsRequired: normalizeDocuments(
      item?.documentsRequired || item?.requiredDocuments
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
      panel.ageCriteria.some(hasAgeData) ||
      panel.documentsRequired.some(
        (item) => item.custom && item.name.trim()
      )
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
    documentsRequired: panel.documentsRequired
      .map((item) => ({
        ...item,
        name: item.name.trim(),
      }))
      .filter((item) => item.name && item.required),
  }));
}
