export type AdmitCardStatus = "Released" | "Coming Soon" | "Closed";

export type AdmitCardLink = {
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
  youtubeUrl?: string;
  youtubeUrls?: string[];
  status: AdmitCardStatus;
  links: AdmitCardLink[];
  createdAt?: any;
  updatedAt?: any;
};