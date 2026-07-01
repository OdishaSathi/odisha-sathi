export type ResultStatus = "Released" | "Coming Soon" | "Closed";

export type ResultLink = {
  label: string;
  url: string;
};

export type ResultPost = {
  id?: string;
  title: string;
  slug: string;
  examName: string;
  organization: string;
  resultDate: string;
  description: string;
  youtubeUrl?: string;
  status: ResultStatus;
  links: ResultLink[];
  createdAt?: any;
  updatedAt?: any;
};