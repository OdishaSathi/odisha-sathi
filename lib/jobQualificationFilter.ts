export type JobQualificationFilter =
  | "all"
  | "10th"
  | "plus2"
  | "iti"
  | "diploma"
  | "graduate"
  | "technical-graduate"
  | "post-graduate";

export type JobQualificationSource = {
  title?: string;
  qualification?: string;
  subCategory?: string;
  subCategories?: string[];
  quickInfoPanels?: Array<{ qualification?: string }>;
  jobInfoPanels?: Array<{ qualification?: string }>;
};

export const JOB_QUALIFICATION_FILTERS: Array<{
  value: JobQualificationFilter;
  label: string;
}> = [
  { value: "all", label: "All Qualifications" },
  { value: "10th", label: "10th / Matric" },
  { value: "plus2", label: "+2 / 12th" },
  { value: "iti", label: "ITI" },
  { value: "diploma", label: "Diploma" },
  { value: "graduate", label: "Graduate / +3" },
  { value: "technical-graduate", label: "Technical Graduate" },
  { value: "post-graduate", label: "Post Graduate" },
];

function normalize(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function buildQualificationText(job: JobQualificationSource) {
  const panelQualifications = [
    ...(Array.isArray(job.quickInfoPanels) ? job.quickInfoPanels : []),
    ...(Array.isArray(job.jobInfoPanels) ? job.jobInfoPanels : []),
  ]
    .map((panel) => panel?.qualification || "")
    .filter(Boolean);

  return normalize(
    [
      job.title,
      job.qualification,
      job.subCategory,
      ...(Array.isArray(job.subCategories) ? job.subCategories : []),
      ...panelQualifications,
    ]
      .filter(Boolean)
      .join(" | ")
  );
}

function hasAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

const MATCHERS: Record<Exclude<JobQualificationFilter, "all">, RegExp[]> = {
  "10th": [
    /(^|[^\d])10th([^\d]|$)/i,
    /\bclass\s*10\b/i,
    /\bmatric(?:ulation)?\b/i,
    /\bsecondary\s+(?:school|education)\b/i,
  ],
  plus2: [
    /\+\s*2\b/i,
    /\bplus\s*2\b/i,
    /\b12th\b/i,
    /\bclass\s*12\b/i,
    /\b10\s*\+\s*2\b/i,
    /\bhigher\s+secondary\b/i,
    /\bintermediate\b/i,
  ],
  iti: [
    /\biti\b/i,
    /\bindustrial\s+training\s+institute\b/i,
    /\bindustrial\s+training\s+certificate\b/i,
  ],
  diploma: [/\bdiploma\b/i, /\bpolytechnic\b/i],
  graduate: [
    /\+\s*3\b/i,
    /\bplus\s*3\b/i,
    /\bgraduate\b/i,
    /\bgraduation\b/i,
    /\bbachelor(?:'s)?\b/i,
    /\bb\.?\s*a\.?\b/i,
    /\bb\.?\s*sc\.?\b/i,
    /\bb\.?\s*com\.?\b/i,
    /\bbba\b/i,
    /\bbca\b/i,
    /\bdegree\b/i,
  ],
  "technical-graduate": [
    /\btechnical\s+graduate\b/i,
    /\bb\.?\s*tech\.?\b/i,
    /\bbtech\b/i,
    /\bb\.?\s*e\.?\b/i,
    /\bbachelor(?:'s)?\s+of\s+engineering\b/i,
    /\bengineering\s+degree\b/i,
  ],
  "post-graduate": [
    /\bpost\s*-?\s*graduate\b/i,
    /\bpostgraduate\b/i,
    /\bmaster(?:'s)?\b/i,
    /\bm\.?\s*a\.?\b/i,
    /\bm\.?\s*sc\.?\b/i,
    /\bm\.?\s*com\.?\b/i,
    /\bmba\b/i,
    /\bmca\b/i,
    /\bm\.?\s*tech\.?\b/i,
    /\bllm\b/i,
  ],
};

export function matchesJobQualification(
  job: JobQualificationSource,
  filter: JobQualificationFilter
) {
  if (filter === "all") return true;

  const text = buildQualificationText(job);
  if (!text) return false;

  return hasAny(text, MATCHERS[filter]);
}
