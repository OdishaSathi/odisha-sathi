export type AdmitCardStatus = "Released" | "Coming Soon" | "Closed";

export type AdmitCardLink = {
  id?: string;
  type?: string;
  label: string;
  url: string;
};

export type AdmitCardDateRow = {
  label: string;
  value: string;
};

export type AdmitCard = {
  id?: string;
  title: string;
  slug: string;
  examName: string;
  organization: string;
  updateType?: "admit-card" | "exam";
  updateTypeLabel?: string;
  subCategory?: string;
  subCategories?: string[];
  admitCardCategory?: string;
  admitCardCategories?: string[];
  examCategory?: string;
  examCategories?: string[];
  categoryName?: string;
  categorySlug?: string;
  subCategorySlug?: string;
  admitCardDate: string;
  admitCardDateDisplay?: string;
  examDate: string;
  examDateDisplay?: string;
  importantDates?: AdmitCardDateRow[];
  description: string;
  notificationNumber?: string;
  previewImageUrl?: string;
  imageUrl?: string;
  examMode?: string;
  downloadProcess?: string;
  applicationProcess?: string;
  documentsRequired?: import("@/lib/jobDetails").RequiredDocumentRow[];
  contentSections?: import("@/lib/flexibleDetails").FlexibleDetailSection[];
  detailSections?: import("@/lib/flexibleDetails").FlexibleDetailSection[];
  dataTables?: import("@/lib/flexibleDetails").FlexibleDataTable[];
  customTables?: import("@/lib/flexibleDetails").FlexibleDataTable[];
  youtubeUrl?: string;
  youtubeUrls?: string[];
  status: AdmitCardStatus;
  links: AdmitCardLink[];
  importantLinks?: AdmitCardLink[];
  extraLinks?: AdmitCardLink[];
  sourceUrl?: string;
  createdAt?: any;
  updatedAt?: any;
};
