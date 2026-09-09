export type SearchImportantDate = {
  label?: string;
  type?: string;
  value?: string;
};

export type SearchResultRecord = {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  description?: string;
  organization?: string;
  department?: string;
  examName?: string;
  status?: string;
  lifecycleStatus?: string;
  toolName?: string;
  toolCategory?: string;
  externalUrl?: string;
  startDate?: string;
  lastDate?: string;
  examDate?: string;
  resultDate?: string;
  importantDates?: SearchImportantDate[];
  createdAtMs?: number;
  updatedAtMs?: number;
};
