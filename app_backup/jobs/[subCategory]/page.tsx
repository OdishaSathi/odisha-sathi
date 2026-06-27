"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function SubCategoryPage() {
  const params = useParams();
  const subCategory = decodeURIComponent(String(params.subCategory || ""));

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getPosts = async () => {
      setLoading(true);

      const q = query(
        collection(db, "posts"),
        where("subCategories", "array-contains", subCategory)
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPosts(data);
      setLoading(false);
    };

    if (subCategory) {
      getPosts();
    }
  }, [subCategory]);

  return (
    <main style={{ maxWidth: "800px", margin: "30px auto", padding: "20px" }}>
      <h1>{subCategory}</h1>

      {loading && <p>Loading jobs...</p>}

      {!loading && posts.length === 0 && <p>No jobs found.</p>}

      {!loading &&
        posts.map((post) => (
          <div key={post.id} style={{ marginBottom: "20px" }}>
            <h2>
              <Link href={`/post/${post.slug}`}>{post.title}</Link>
            </h2>
          </div>
        ))}
    </main>
  );
}