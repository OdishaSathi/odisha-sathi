"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import PostCard from "@/components/PostCard";
import { getFirebase, isFirebaseConfigured } from "@/lib/firebase";
import { samplePosts } from "@/lib/samplePosts";
import { Post } from "@/lib/types";

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

function categoryKey(value: string) {
  const text = String(value ?? "").toLowerCase().trim();

  if (text.includes("job")) return "jobs";
  if (text.includes("exam")) return "exams";
  if (text.includes("result")) return "results";
  if (text.includes("scholar")) return "scholarships";
  if (text.includes("scheme")) return "schemes";
  if (text.includes("admission")) return "admissions";

  return text
    .replace("govt-", "")
    .replace("government-", "")
    .replace(/\s+/g, "-");
}

export default function CategoryPosts({ category }: { category: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPosts() {
      try {
        const wantedCategory = categoryKey(category);

        if (!isFirebaseConfigured()) {
          const fallback = samplePosts.filter((post) => categoryKey(post.category) === wantedCategory);
          setPosts(fallback);
          setError("Firebase is not configured.");
          return;
        }

        const { db } = getFirebase();

        if (!db) {
          setError("Firebase database is not available.");
          return;
        }

        const snapshot = await getDocs(collection(db, "posts"));

        const firebasePosts = snapshot.docs
          .map((item) => normalizePost(item.id, item.data()))
          .filter(isPublished)
          .filter((post) => categoryKey(post.category) === wantedCategory);

        setPosts(newestFirst(firebasePosts));
        setError("");
      } catch (err: any) {
        console.error("Category page could not load posts", err);
        setError(err?.message ?? "Category page could not load posts.");
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, [category]);

  if (loading) {
    return <p className="admin-status">Loading category posts...</p>;
  }

  if (error) {
    return <div className="notice error">{error}</div>;
  }

  if (!posts.length) {
    return <p className="admin-status">No published posts found in this category.</p>;
  }

  return (
    <div className="post-grid">
      {posts.map((post) => <PostCard key={post.id} post={post} />)}
    </div>
  );
}