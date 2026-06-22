export const categories = [
  { label: "Latest Jobs", value: "jobs" },
  { label: "Exams", value: "exams" },
  { label: "Results", value: "results" },
  { label: "Scholarships", value: "scholarships" },
  { label: "Govt. Schemes", value: "schemes" },
  { label: "Admissions", value: "admissions" }
];

export function getCategoryLabel(value?: string) {
  return categories.find((cat) => cat.value === value)?.label ?? "Updates";
}
