export type AdmitCardStatus = "Released" | "Coming Soon" | "Closed";

export type AdmitCardLink = {
  label: string;
  url: string;
};

export type AdmitCard = {
  id?: string;
  title: string;
  slug: string;
  examName: string;
  organization: string;
  admitCardDate: string;
  examDate: string;
  description: string;
  youtubeUrl?: string;
  status: AdmitCardStatus;
  links: AdmitCardLink[];
  createdAt?: any;
  updatedAt?: any;
};