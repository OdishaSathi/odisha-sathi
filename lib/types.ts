export type PostStatus = "published" | "draft" | "archived";

export type ImportantDateRow = {
  id?: string;
  type?: string;
  label?: string;
  value?: string;
};

export type ImportantLinkRow = {
  id?: string;
  type?: string;
  label?: string;
  url?: string;
};

export type Post = {
  id: string;

  // Basic post fields
  title: string;
  slug: string;
  category: string;
  subCategories?: string[];

  // Old fields kept for existing website support
  excerpt: string;
  content: string;
  imageUrl?: string;
  bannerImageUrl?: string;
  bannerUrl?: string;
  imageUrls?: string[];
  sourceUrl?: string;
  tags?: string[];

  // New common post detail fields
  shortDescription?: string;
  description?: string;
  notificationNumber?: string;
  previewImageUrl?: string;
  youtubeUrl?: string;

  // Social sharing fields
  shareTitle?: string;
  shareDescription?: string;
  shareImage?: string;

  // Dynamic detail tables
  importantDates?: ImportantDateRow[];
  importantLinks?: ImportantLinkRow[];
  links?: ImportantLinkRow[];
  extraLinks?: ImportantLinkRow[];
  jobInfoPanels?: import("@/lib/jobDetails").JobInfoPanel[];
  feeStructureRows?: import("@/lib/jobDetails").JobFeeRow[];
  applicationFeeRows?: import("@/lib/jobDetails").JobFeeRow[];
  documentsRequired?: import("@/lib/jobDetails").RequiredDocumentRow[];
  requiredDocuments?: import("@/lib/jobDetails").RequiredDocumentRow[];
  contentSections?: import("@/lib/flexibleDetails").FlexibleDetailSection[];
  detailSections?: import("@/lib/flexibleDetails").FlexibleDetailSection[];
  dataTables?: import("@/lib/flexibleDetails").FlexibleDataTable[];
  customTables?: import("@/lib/flexibleDetails").FlexibleDataTable[];

  // Jobs-specific optional fields
  organization?: string;
  department?: string;
  postName?: string;
  totalVacancy?: string;
  applicationMode?: string;
  modeOfApplication?: string;
  feeStructure?: string;
  applicationFee?: string;
  qualification?: string;
  ageLimit?: string;
  salary?: string;
  payScale?: string;

  // Status and timestamps
  status: PostStatus;
  createdAt?: string;
  updatedAt?: string;
};
