import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { getFirebase } from "./firebase";
import { samplePosts } from "./samplePosts";
import { Post } from "./types";

function normalizePost(id: string, data: any): Post {
  const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt ?? "";
  const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt ?? "";

  return {
    id,
    title: data.title ?? "Untitled",
    slug: data.slug ?? id,
    category: data.category ?? "jobs",
    excerpt: data.excerpt ?? "",
    content: data.content ?? "",
    status: data.status ?? "published",
    imageUrl: data.imageUrl ?? "",
    sourceUrl: data.sourceUrl ?? "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    createdAt,
    updatedAt
  };
}

function newestFirst(posts: Post[]) {
  return posts.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
}

function isPublished(post: Post) {
  return String(post.status ?? "published").toLowerCase() === "published";
}

export async function getPublishedPosts(maxPosts = 20): Promise<Post[]> {
  const { db } = getFirebase();

  if (!db) return samplePosts;

  try {
    const snapshot = await getDocs(collection(db, "posts"));

    const posts = snapshot.docs
      .map((item) => normalizePost(item.id, item.data()))
      .filter(isPublished);

    return newestFirst(posts).slice(0, maxPosts);
  } catch (error) {
    console.error("Could not load posts", error);
    return samplePosts;
  }
}

export async function getPostsByCategory(category: string): Promise<Post[]> {
  const { db } = getFirebase();

  if (!db) {
    return samplePosts.filter((post) => post.category === category);
  }

  try {
    const snapshot = await getDocs(collection(db, "posts"));

    const posts = snapshot.docs
      .map((item) => normalizePost(item.id, item.data()))
      .filter((post) => isPublished(post))
      .filter((post) => post.category === category);

    return newestFirst(posts).slice(0, 30);
  } catch (error) {
    console.error("Could not load category posts", error);
    return samplePosts.filter((post) => post.category === category);
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { db } = getFirebase();

  if (!db) {
    return samplePosts.find((post) => post.slug === slug || post.id === slug) ?? null;
  }

  try {
    const q = query(collection(db, "posts"), where("slug", "==", slug), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const postDoc = snapshot.docs[0];
      return normalizePost(postDoc.id, postDoc.data());
    }

    const byId = await getDoc(doc(db, "posts", slug));

    if (byId.exists()) {
      return normalizePost(byId.id, byId.data());
    }

    return null;
  } catch (error) {
    console.error("Could not load post", error);
    return null;
  }
}