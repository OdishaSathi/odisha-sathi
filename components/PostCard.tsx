import Link from "next/link";
import { getDefaultCategoryPreviewImage } from "@/lib/defaultImages";
import { Post } from "@/lib/types";

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPreviewImage(post: Post) {
  if (post.category === "tools") return post.imageUrl || "";

  return (
    post.imageUrl ||
    post.previewImageUrl ||
    post.shareImage ||
    getDefaultCategoryPreviewImage(
      post.category,
      post.shortDescription || post.excerpt || post.title
    )
  );
}

export default function PostCard({ post }: { post: Post }) {
  const previewImage = getPreviewImage(post);

  return (
    <article className="post-card">
      {previewImage ? (
        <img src={previewImage} alt={post.title} className="post-card-image" />
      ) : null}

      <div className="post-card-body">
        <p className="post-category">{post.category}</p>

        <h3>
          <Link href={`/post/${post.slug || post.id}`}>{post.title}</Link>
        </h3>

        {post.excerpt ? <p>{post.excerpt}</p> : null}

        <div className="post-meta">
          <span>{formatDate(post.createdAt)}</span>
          <Link href={`/post/${post.slug || post.id}`}>Read more →</Link>
        </div>
      </div>
    </article>
  );
}
