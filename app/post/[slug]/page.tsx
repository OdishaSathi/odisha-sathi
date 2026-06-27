"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";

type PostData = {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  category?: string;
  subCategory?: string;
  subCategories?: string[];
  createdAt?: any;
  updatedAt?: any;
};

function getBackLink(category?: string) {
  if (category === "jobs") return "/jobs";
  if (category === "results") return "/results";
  if (category === "admissions") return "/admissions";
  if (category === "admit-cards") return "/admit-cards";
  if (category === "schemes") return "/schemes";
  return "/";
}

function getCategoryLabel(category?: string) {
  if (category === "jobs") return "Jobs";
  if (category === "results") return "Results";
  if (category === "admissions") return "Admissions";
  if (category === "admit-cards") return "Admit Cards";
  if (category === "schemes") return "Schemes";
  return "Post";
}

export default function PublicPostDetailsPage() {
  const params = useParams();

  const rawSlug =
    typeof params.slug === "string"
      ? params.slug
      : Array.isArray(params.slug)
      ? params.slug[0]
      : "";

  const pageSlug = decodeURIComponent(rawSlug);

  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);

        const snapshot = await getDocs(collection(db, "posts"));

        const allPosts: PostData[] = snapshot.docs.map((docItem) => {
          const data = docItem.data();

          return {
            id: docItem.id,
            title: data.title || "",
            slug: data.slug || "",
            content: data.content || "",
            category: data.category || "",
            subCategory: data.subCategory || "",
            subCategories: Array.isArray(data.subCategories)
              ? data.subCategories
              : data.subCategory
              ? [data.subCategory]
              : [],
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
          };
        });

        const foundPost =
          allPosts.find((item) => item.slug === pageSlug) ||
          allPosts.find((item) => item.id === pageSlug) ||
          null;

        setPost(foundPost);
      } catch (error) {
        console.error(error);
        alert("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [pageSlug]);

  if (loading) {
    return (
      <main className="post-details-main">
        <p className="post-loading-text">Loading post...</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="post-details-main">
        <Link href="/" className="post-back-link">
          ← Back to Home
        </Link>

        <div className="post-not-found-card">
          <h1>Post not found</h1>
          <p>This post may have been removed or the link may be wrong.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="post-details-main">
      <Link href={getBackLink(post.category)} className="post-back-link">
        ← Back
      </Link>

      <article className="post-details-card">
        <p className="post-category-badge">{getCategoryLabel(post.category)}</p>

        <h1 className="post-details-title">{post.title}</h1>

        {post.subCategories && post.subCategories.length > 0 ? (
          <div className="post-subcategory-row">
            {post.subCategories.map((item) => (
              <Link
                key={item}
                href={`/jobs/${encodeURIComponent(item)}`}
                className="post-subcategory-chip"
              >
                {item}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="post-details-content">
          {post.content || "No details available."}
        </div>
      </article>
    </main>
  );
}