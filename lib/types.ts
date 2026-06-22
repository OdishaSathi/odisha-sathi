export type PostStatus = "published" | "draft";

export type Post = {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  imageUrl?: string;
  sourceUrl?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
};
