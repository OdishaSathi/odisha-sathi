import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <Image
            src="/odisha-sathi-logo.png"
            alt="Odisha Sathi Logo"
            width={58}
            height={58}
            className="brand-logo"
            priority
          />

          <span className="brand-text">
            <strong>{siteConfig.siteName}</strong>
            <small>{siteConfig.tagline}</small>
          </span>
        </Link>

        <nav className="main-nav">
          {siteConfig.headerNav.map((item) => (
            <Link key={item.label} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}