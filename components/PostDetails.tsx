"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { getFirebase, isFirebaseConfigured } from "@/lib/firebase";
import { samplePosts } from "@/lib/samplePosts";
import { Post } from "@/lib/types";

function makeSlug(value: string) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function normalizePost(id: string, data: any): Post {
  const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt ?? "";
  const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt ?? "";

  const title = data.title ?? "Untitled";
  const savedSlug = data.slug && String(data.slug).trim() ? data.slug : "";
  const slug = savedSlug || makeSlug(title) || id;

  return {
    id,
    title,
    slug,
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

function isPublished(post: Post) {
  return String(post.status ?? "published").toLowerCase() === "published";
}

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export default function PostDetails({ slug }: { slug: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPost() {
      try {
        const cleanSlug = decodeURIComponent(slug);

        if (!isFirebaseConfigured()) {
          const fallback =
            samplePosts.find((item) => item.slug === cleanSlug || item.id === cleanSlug || makeSlug(item.title) === cleanSlug) ?? null;

          setPost(fallback);
          return;
        }

        const { db } = getFirebase();

        if (!db) {
          setError("Firebase database is not available.");
          return;
        }

        // 1. Try by document ID
        const byId = await getDoc(doc(db, "posts", cleanSlug));

        if (byId.exists()) {
          const found = normalizePost(byId.id, byId.data());
          if (isPublished(found)) {
            setPost(found);
            return;
          }
        }

        // 2. Try by saved slug
        const q = query(collection(db, "posts"), where("slug", "==", cleanSlug), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const postDoc = snapshot.docs[0];
          const found = normalizePost(postDoc.id, postDoc.data());
          if (isPublished(found)) {
            setPost(found);
            return;
          }
        }

        // 3. Last fallback: read all posts and match title-generated slug
        const allPosts = await getDocs(collection(db, "posts"));
        const matched =
          allPosts.docs
            .map((item) => normalizePost(item.id, item.data()))
            .filter(isPublished)
            .find((item) => item.slug === cleanSlug || item.id === cleanSlug || makeSlug(item.title) === cleanSlug) ?? null;

        setPost(matched);
      } catch (err: any) {
        console.error("Could not load post", err);
        setError(err?.message ?? "Could not load post.");
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <section className="section container">
        <p className="admin-status">Loading post...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section container">
        <div className="notice error">{error}</div>
      </section>
    );
  }

  if (!post) {
    return (
      <section className="section container">
        <p>
          <Link href="/">Home</Link>
        </p>
        <h1>Post not found</h1>
        <p>This post may have been deleted or unpublished.</p>
      </section>
    );
  }

  return (
    <article className="section container post-detail">
      <p>
        <Link href="/">Home</Link> / <Link href={`/category/${makeSlug(post.category)}`}>{post.category}</Link>
      </p>

      <h1>{post.title}</h1>

      <p className="post-meta">
        {post.category}
        {post.createdAt ? ` • ${formatDate(post.createdAt)}` : ""}
      </p>

      {post.imageUrl ? <img src={post.imageUrl} alt={post.title} className="post-hero-image" /> : null}

      {post.excerpt ? <p className="post-excerpt">{post.excerpt}</p> : null}

      <div className="post-content" style={{ whiteSpace: "pre-line" }}>
        {post.content}
      </div>

      {post.sourceUrl ? (
        <p>
          <a href={post.sourceUrl} target="_blank" rel="noreferrer" className="btn outline">
            Official Link
          </a>
        </p>
      ) : null}
    </article>
  );
}