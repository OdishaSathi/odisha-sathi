import Link from "next/link";
import { Post } from "@/lib/types";

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="post-card">
      {post.imageUrl ? (
        <img src={post.imageUrl} alt={post.title} className="post-card-image" />
      ) : null}

      <div className="post-card-body">
        <p className="post-category">{post.category}</p>

        <h3>
          <Link href={`/post/${post.slug || post.id}`}>
            {post.title}
          </Link>
        </h3>

        {post.excerpt ? <p>{post.excerpt}</p> : null}

        <div className="post-meta">
          <span>{formatDate(post.createdAt)}</span>
          <Link href={`/post/${post.slug || post.id}`}>
            Read more →
          </Link>
        </div>
      </div>
    </article>
  );
}