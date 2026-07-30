export type ResultStatus = "Released" | "Coming Soon" | "Closed";

export type ResultLink = {
  id?: string;
  type?: string;
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
  notificationNumber?: string;
  previewImageUrl?: string;
  imageUrl?: string;
  resultCheckingProcess?: string;
  applicationProcess?: string;
  documentsRequired?: import("@/lib/jobDetails").RequiredDocumentRow[];
  contentSections?: import("@/lib/flexibleDetails").FlexibleDetailSection[];
  detailSections?: import("@/lib/flexibleDetails").FlexibleDetailSection[];
  dataTables?: import("@/lib/flexibleDetails").FlexibleDataTable[];
  customTables?: import("@/lib/flexibleDetails").FlexibleDataTable[];
  youtubeUrl?: string;
  youtubeUrls?: string[];
  status: ResultStatus;
  links: ResultLink[];
  importantLinks?: ResultLink[];
  extraLinks?: ResultLink[];
  sourceUrl?: string;
  createdAt?: any;
  updatedAt?: any;
};
