"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import AdminLayout from "@/components/admin/AdminLayout";
import { db } from "@/lib/firebase";
import { isPublicListingPost } from "@/lib/publicPostQuality";

type HomePost = {
  id: string;
  title: string;
  category: string;
  homeLatestSelected: boolean;
  homeLatestHidden: boolean;
  homeLatestOrder: number;
  createdAt?: any;
};

const allowedCategories = [
  "jobs",
  "results",
  "admissions",
  "admit-cards",
  "citizen-services",
];

export default function AdminHomepagePostsPage() {
  const [posts, setPosts] = useState<HomePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [search, setSearch] = useState("");

  async function loadPosts() {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "posts"));
      setPosts(
        snapshot.docs
          .map((item) => ({
            id: item.id,
            title: item.data().title || "Untitled Post",
            category: item.data().category || "",
            homeLatestSelected: Boolean(item.data().homeLatestSelected),
            homeLatestHidden: Boolean(item.data().homeLatestHidden),
            homeLatestOrder: Number(item.data().homeLatestOrder || 999),
            createdAt: item.data().createdAt || null,
            status: item.data().status,
            published: item.data().published,
          }))
          .filter(
            (item) =>
              allowedCategories.includes(item.category) &&
              isPublicListingPost(item, item.id)
          )
          .sort((a, b) => {
            if (a.homeLatestSelected !== b.homeLatestSelected) {
              return a.homeLatestSelected ? -1 : 1;
            }
            if (a.homeLatestSelected && b.homeLatestSelected) {
              return a.homeLatestOrder - b.homeLatestOrder;
            }
            return (
              (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
            );
          })
      );
    } catch (error) {
      console.error(error);
      alert("Failed to load homepage posts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  const visiblePosts = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return posts;
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(text) ||
        post.category.toLowerCase().includes(text)
    );
  }, [posts, search]);

  async function savePost(
    post: HomePost,
    changes: Partial<HomePost>
  ) {
    const nextPost = { ...post, ...changes };
    try {
      setSavingId(post.id);
      await updateDoc(doc(db, "posts", post.id), {
        homeLatestSelected: nextPost.homeLatestSelected,
        homeLatestHidden: nextPost.homeLatestHidden,
        homeLatestOrder: Number(nextPost.homeLatestOrder || 999),
      });
      setPosts((items) =>
        items.map((item) => (item.id === post.id ? nextPost : item))
      );
    } catch (error) {
      console.error(error);
      alert("Failed to update homepage control.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <AdminLayout>
      <div className="homepage-control-page">
        <header>
          <div>
            <h1>Homepage Latest Posts</h1>
            <p>
              Prioritize, replace or hide posts in the colourful Latest Posts
              tiles without deleting them from normal lists.
            </p>
          </div>
          <button type="button" onClick={loadPosts}>Refresh</button>
        </header>

        <div className="homepage-control-note">
          Selected posts appear first by order number. Remaining recent posts
          automatically fill empty tile positions. Hidden posts remain
          published everywhere else.
        </div>

        <input
          className="homepage-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search title or category"
        />

        {loading ? (
          <p>Loading posts…</p>
        ) : (
          <div className="homepage-control-list">
            {visiblePosts.map((post) => (
              <article key={post.id}>
                <div>
                  <span>{post.category.replace(/-/g, " ")}</span>
                  <h2>{post.title}</h2>
                </div>

                <div className="homepage-control-actions">
                  <label>
                    <input
                      type="checkbox"
                      checked={post.homeLatestSelected}
                      disabled={savingId === post.id}
                      onChange={(event) =>
                        savePost(post, {
                          homeLatestSelected: event.target.checked,
                          homeLatestHidden: event.target.checked
                            ? false
                            : post.homeLatestHidden,
                        })
                      }
                    />
                    Prioritize
                  </label>

                  <label>
                    Order
                    <input
                      type="number"
                      min={1}
                      value={post.homeLatestOrder}
                      disabled={savingId === post.id}
                      onChange={(event) =>
                        setPosts((items) =>
                          items.map((item) =>
                            item.id === post.id
                              ? {
                                  ...item,
                                  homeLatestOrder: Number(
                                    event.target.value || 999
                                  ),
                                }
                              : item
                          )
                        )
                      }
                      onBlur={(event) =>
                        savePost(post, {
                          homeLatestOrder: Number(event.target.value || 999),
                        })
                      }
                    />
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      checked={post.homeLatestHidden}
                      disabled={savingId === post.id}
                      onChange={(event) =>
                        savePost(post, {
                          homeLatestHidden: event.target.checked,
                          homeLatestSelected: event.target.checked
                            ? false
                            : post.homeLatestSelected,
                        })
                      }
                    />
                    Hide from tiles
                  </label>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        .homepage-control-page {
          display: grid;
          gap: 18px;
        }
        .homepage-control-page > header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .homepage-control-page h1,
        .homepage-control-page p {
          margin: 0;
        }
        .homepage-control-page header p {
          margin-top: 5px;
          color: #64748b;
        }
        .homepage-control-page button {
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 9px 12px;
          background: #ffffff;
          color: #1d4ed8;
          font-weight: 800;
          cursor: pointer;
        }
        .homepage-control-note {
          padding: 13px;
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          background: #eff6ff;
          color: #1e40af;
          font-weight: 750;
          line-height: 1.55;
        }
        .homepage-search {
          width: 100%;
          min-height: 44px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 10px 12px;
        }
        .homepage-control-list {
          display: grid;
          gap: 10px;
        }
        .homepage-control-list article {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          padding: 13px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #ffffff;
        }
        .homepage-control-list span {
          color: #ea580c;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .homepage-control-list h2 {
          margin: 4px 0 0;
          font-size: 15px;
        }
        .homepage-control-actions {
          display: flex;
          align-items: center;
          gap: 13px;
          flex-wrap: wrap;
        }
        .homepage-control-actions label {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #334155;
          font-size: 13px;
          font-weight: 800;
        }
        .homepage-control-actions input[type="number"] {
          width: 70px;
          min-height: 34px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 6px;
        }
      `}</style>
    </AdminLayout>
  );
}
