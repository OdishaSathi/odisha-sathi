export type ResultStatus = "Released" | "Coming Soon" | "Closed";

export type ResultLink = {
  label: string;
  url: string;
};

export type ResultDateRow = {
  label: string;
  value: string;
};

export type ResultPost = {
  id?: string;
  title: string;
  slug: string;
  examName: string;
  organization: string;
  subCategory?: string;
  subCategories?: string[];
  resultCategory?: string;
  resultCategories?: string[];
  categoryName?: string;
  categorySlug?: string;
  subCategorySlug?: string;
  resultDate: string;
  resultDateDisplay?: string;
  importantDates?: ResultDateRow[];
  description: string;
  youtubeUrl?: string;
  youtubeUrls?: string[];
  status: ResultStatus;
  links: ResultLink[];
  createdAt?: any;
  updatedAt?: any;
};