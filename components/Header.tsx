"use client";

import SearchBox from "@/components/SearchBox";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/siteConfig";

export default function Header() {
  const [hideHeader, setHideHeader] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isMobile = window.innerWidth <= 900;

      if (!isMobile) {
        setHideHeader(false);
        return;
      }

      if (currentScrollY < 40) {
        setHideHeader(false);
      } else if (currentScrollY > lastScrollY + 5) {
        setHideHeader(true);
      } else if (currentScrollY < lastScrollY - 5) {
        setHideHeader(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header className={`site-header ${hideHeader ? "header-hidden-mobile" : ""}`}>
      <div className="container header-inner">
        <Link href="/" className="brand">
          <Image
            src="/odisha-sathi-logo.png"
            alt="Odisha Sathi Logo"
            width={90}
            height={90}
            className="brand-logo"
            priority
          />

          <span className="brand-text">
            <strong>{siteConfig.siteName}</strong>
            <small>{siteConfig.tagline}</small>
          </span>
        </Link>

        <div className="header-right">
          <nav className="main-nav">
            {siteConfig.headerNav.map((item) => (
              <Link key={item.label} href={item.href} className="nav-link">
                {item.label}
              </Link>
            ))}
          </nav>

          <SearchBox />
        </div>
      </div>
    </header>
  );
}