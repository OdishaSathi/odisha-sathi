"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/public/FloatingWhatsApp";
import SocialFollowPromo from "@/components/SocialFollowPromo";

function shouldHideSocialFollow(pathname: string) {
  if (!pathname || pathname === "/") return false;
  if (pathname.startsWith("/admin")) return true;

  const cleanPath = pathname.split("?")[0].replace(/\/$/, "");
  const parts = cleanPath.split("/").filter(Boolean);

  // Hide on all post/detail pages. Keep category/listing/static pages visible.
  if (parts[0] === "post" && parts.length >= 2) return true;
  if (parts[0] === "important-information" && parts.length >= 2) return true;
  if (parts[0] === "schemes" && parts.length >= 2) return true;

  return false;
}

export default function SiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAdminPage = pathname.startsWith("/admin");

  if (isAdminPage) {
    return <>{children}</>;
  }

  const showSocialFollow = !shouldHideSocialFollow(pathname);

  return (
    <>
      <Header />
      <main>{children}</main>
      {showSocialFollow ? (
        <div className="container site-social-follow-wrap">
          <SocialFollowPromo />
        </div>
      ) : null}
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
