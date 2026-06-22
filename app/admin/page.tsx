"use client";

import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { categories } from "@/lib/categories";
import { getFirebase, isFirebaseConfigured } from "@/lib/firebase";
import { Post } from "@/lib/types";

type FormState = {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  sourceUrl: string;
  tags: string;
  status: "published" | "draft";
};

const initialForm: FormState = {
  title: "",
  slug: "",
  category: "jobs",
  excerpt: "",
  content: "",
  imageUrl: "",
  sourceUrl: "",
  tags: "",
  status: "published"
};

function makeSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

function normalizeDoc(id: string, data: any): Post {
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
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt ?? "",
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt ?? ""
  };
}

export default function AdminPage() {
  const configured = isFirebaseConfigured();
  const firebase = useMemo(() => getFirebase(), []);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!firebase.auth) return;
    const unsub = onAuthStateChanged(firebase.auth, (nextUser) => setUser(nextUser));
    return () => unsub();
  }, [firebase.auth]);

  async function loadPosts() {
    if (!firebase.db) return;
    try {
      const q = query(collection(firebase.db, "posts"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setPosts(snap.docs.map((item) => normalizeDoc(item.id, item.data())));
    } catch (error: any) {
      setMessage({ type: "error", text: error.message ?? "Unable to load posts. Check Firestore rules/indexes." });
    }
  }

  useEffect(() => {
    if (user) loadPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    if (!firebase.auth) return;
    setLoading(true);
    setMessage(null);
    try {
      await signInWithEmailAndPassword(firebase.auth, email, password);
      setMessage({ type: "success", text: "Logged in successfully." });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message ?? "Login failed." });
    } finally {
      setLoading(false);
    }
  }

  function updateForm(name: keyof FormState, value: string) {
    setForm((old) => ({ ...old, [name]: value }));
  }

  function fillForEdit(post: Post) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      category: post.category,
      excerpt: post.excerpt,
      content: post.content,
      imageUrl: post.imageUrl ?? "",
      sourceUrl: post.sourceUrl ?? "",
      tags: post.tags?.join(", ") ?? "",
      status: post.status
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function savePost(event: React.FormEvent) {
    event.preventDefault();
    if (!firebase.db) return;
    setLoading(true);
    setMessage(null);
    const finalSlug = form.slug || makeSlug(form.title);

    if (!form.title.trim() || !finalSlug.trim() || !form.content.trim()) {
      setMessage({ type: "error", text: "Title, slug and content are required." });
      setLoading(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      slug: finalSlug.trim(),
      category: form.category,
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      imageUrl: form.imageUrl.trim(),
      sourceUrl: form.sourceUrl.trim(),
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      status: form.status,
      updatedAt: serverTimestamp(),
      ...(editingId ? {} : { createdAt: serverTimestamp() })
    };

    try {
      if (editingId) {
        await updateDoc(doc(firebase.db, "posts", editingId), payload);
        setMessage({ type: "success", text: "Post updated successfully." });
      } else {
        await addDoc(collection(firebase.db, "posts"), payload);
        setMessage({ type: "success", text: "Post saved successfully. It will open using /post/" + finalSlug });
      }
      setForm(initialForm);
      setEditingId(null);
      await loadPosts();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message ?? "Could not save post. Check Firestore rules." });
    } finally {
      setLoading(false);
    }
  }

  async function removePost(id: string) {
    if (!firebase.db) return;
    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) return;
    try {
      await deleteDoc(doc(firebase.db, "posts", id));
      setMessage({ type: "success", text: "Post deleted." });
      await loadPosts();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message ?? "Could not delete post." });
    }
  }

  if (!configured) {
    return (
      <section className="section container">
        <div className="notice error">
          Firebase is not configured. Create <strong>.env.local</strong> from <strong>.env.local.example</strong> and paste your Firebase web app keys.
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="section container">
        <div className="auth-panel" style={{ maxWidth: 460, margin: "0 auto" }}>
          <h1>Admin Login</h1>
          <p className="admin-status">Login with the email/password user created in Firebase Authentication.</p>
          {message ? <div className={`notice ${message.type}`}>{message.text}</div> : null}
          <form onSubmit={handleLogin} className="form-grid">
            <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></label>
            <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></label>
            <button className="btn" disabled={loading}>{loading ? "Please wait..." : "Login"}</button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="section container">
      <div className="section-title">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Create and manage Odisha Sathi posts.</p>
        </div>
        <button className="btn outline" onClick={() => firebase.auth && signOut(firebase.auth)}>Logout</button>
      </div>

      {message ? <div className={`notice ${message.type}`}>{message.text}</div> : null}

      <div className="admin-wrap">
        <aside className="auth-panel">
          <h3>Logged in</h3>
          <p className="admin-status">{user.email}</p>
          <p className="admin-status">Tip: Use unique slugs. Example: ossc-cglre-specialist-2026</p>
        </aside>

        <div className="form-panel">
          <h2>{editingId ? "Edit Post" : "Create Post"}</h2>
          <form onSubmit={savePost} className="form-grid">
            <label>Title<input value={form.title} onChange={(e) => updateForm("title", e.target.value)} onBlur={() => !form.slug && updateForm("slug", makeSlug(form.title))} required /></label>
            <label>Slug<input value={form.slug} onChange={(e) => updateForm("slug", makeSlug(e.target.value))} placeholder="post-url-slug" required /></label>
            <label>Category
              <select value={form.category} onChange={(e) => updateForm("category", e.target.value)}>
                {categories.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
            </label>
            <label>Short Summary<textarea value={form.excerpt} onChange={(e) => updateForm("excerpt", e.target.value)} style={{ minHeight: 90 }} /></label>
            <label>Full Content<textarea value={form.content} onChange={(e) => updateForm("content", e.target.value)} required /></label>
            <label>Image URL<input value={form.imageUrl} onChange={(e) => updateForm("imageUrl", e.target.value)} placeholder="Optional poster/image URL" /></label>
            <label>Official Link<input value={form.sourceUrl} onChange={(e) => updateForm("sourceUrl", e.target.value)} placeholder="Optional official website link" /></label>
            <label>Tags<input value={form.tags} onChange={(e) => updateForm("tags", e.target.value)} placeholder="OSSC, Job, Odisha" /></label>
            <label>Status
              <select value={form.status} onChange={(e) => updateForm("status", e.target.value as "published" | "draft")}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
            <button className="btn" disabled={loading}>{loading ? "Saving..." : editingId ? "Update Post" : "Save Post"}</button>
            {editingId ? <button type="button" className="btn outline" onClick={() => { setEditingId(null); setForm(initialForm); }}>Cancel Edit</button> : null}
          </form>
        </div>
      </div>

      <div className="section">
        <div className="section-title">
          <div><h2>Existing Posts</h2><p>Edit, delete or open published posts.</p></div>
        </div>
        <div className="post-grid">
          {posts.map((post) => (
            <article className="post-card" key={post.id}>
              <div className="card-badge">{post.status} • {post.category}</div>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <div className="article-actions">
                <a className="btn outline" href={`/post/${post.slug || post.id}`} target="_blank">Open</a>
                <button className="btn" onClick={() => fillForEdit(post)}>Edit</button>
                <button className="btn danger" onClick={() => removePost(post.id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
