import PostDetails from "@/components/PostDetails";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PostPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <PostDetails slug={slug} />;
}