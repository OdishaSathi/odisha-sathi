"use client";

import SearchBox from "@/components/SearchBox";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/siteConfig";

export default function Header() {
  const [hideHeader, setHideHeader] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isMobileOrTablet = window.innerWidth <= 1024;

      if (!isMobileOrTablet) {
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

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={`site-header clean-site-header ${
          hideHeader ? "header-hidden-mobile" : ""
        }`}
      >
        <div className="container clean-header-inner">
          <Link href="/" className="clean-brand" onClick={() => setMobileMenuOpen(false)}>
            <Image
              src="/odisha-sathi-logo.png"
              alt="Odisha Sathi Logo"
              width={64}
              height={64}
              className="clean-brand-logo"
              priority
            />

            <span className="clean-brand-title">{siteConfig.siteName}</span>
          </Link>

          <div className="clean-header-right">
            <nav className="clean-main-nav" aria-label="Main navigation">
              {siteConfig.headerNav.map((item) => (
                <Link key={item.label} href={item.href} className="clean-nav-link">
                  {item.label}
                </Link>
              ))}
            </nav>

            <SearchBox />

            <button
              type="button"
              className="clean-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              title="Menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`mobile-menu-backdrop ${mobileMenuOpen ? "show" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <aside className={`mobile-side-menu ${mobileMenuOpen ? "open" : ""}`}>
        <div className="mobile-side-header">
          <div className="mobile-side-brand">
            <Image
              src="/odisha-sathi-logo.png"
              alt="Odisha Sathi Logo"
              width={46}
              height={46}
            />
            <strong>{siteConfig.siteName}</strong>
          </div>

          <button
            type="button"
            className="mobile-side-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <nav className="mobile-side-nav" aria-label="Mobile navigation">
          {siteConfig.headerNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <style jsx global>{`
        .clean-site-header {
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        .clean-header-inner {
          min-height: 74px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .clean-brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: #0f172a;
          min-width: 0;
        }

        .clean-brand-logo {
          width: 56px;
          height: 56px;
          object-fit: contain;
          flex: 0 0 auto;
        }

        .clean-brand-title {
          font-size: 28px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.04em;
          color: #0f172a;
          white-space: nowrap;
        }

        .clean-header-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 14px;
          min-width: 0;
        }

        .clean-main-nav {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .clean-nav-link {
          color: #334155;
          text-decoration: none;
          font-size: 14px;
          line-height: 1;
          font-weight: 700;
          padding: 10px 11px;
          border-radius: 999px;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .clean-nav-link:hover {
  background: #fff7ed;
  color: #ea580c;
}
        }

        .os-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .os-search-icon-btn,
        .clean-menu-btn {
          width: 40px;
          height: 40px;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          background: #ffffff;
          color: #1d4ed8;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .os-search-icon-btn:hover,
        .clean-menu-btn:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .os-search-icon-btn svg,
        .os-search-submit svg {
          width: 20px;
          height: 20px;
          fill: currentColor;
        }

        .os-search-form {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 270px;
          height: 42px;
          padding: 4px 6px 4px 12px;
          border: 1px solid #bfdbfe;
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 8px 22px rgba(37, 99, 235, 0.12);
        }

        .os-search-form input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: #0f172a;
          font-size: 14px;
          font-weight: 500;
        }

        .os-search-form input::placeholder {
          color: #94a3b8;
        }

        .os-search-submit,
        .os-search-close {
          width: 30px;
          height: 30px;
          border: none;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex: 0 0 auto;
        }

        .os-search-submit {
          background: #2563eb;
          color: #ffffff;
        }

        .os-search-close {
          background: #f1f5f9;
          color: #475569;
          font-size: 20px;
          line-height: 1;
        }

        .clean-menu-btn {
          display: none;
          flex-direction: column;
          gap: 4px;
        }

        .clean-menu-btn span {
          width: 17px;
          height: 2px;
          border-radius: 999px;
          background: #1d4ed8;
          display: block;
        }

        .mobile-menu-backdrop {
          display: none;
        }

        .mobile-side-menu {
          display: none;
        }

        @media (max-width: 1024px) {
          .clean-header-inner {
            min-height: 66px;
            gap: 10px;
          }

          .clean-main-nav {
            display: none;
          }

          .clean-menu-btn {
            display: inline-flex;
          }

          .clean-brand-logo {
            width: 46px;
            height: 46px;
          }

          .clean-brand-title {
            font-size: 23px;
            letter-spacing: -0.035em;
          }

          .os-search-form {
            position: fixed;
            top: 76px;
            left: 12px;
            right: 12px;
            width: auto;
            z-index: 80;
          }

          .mobile-menu-backdrop {
            position: fixed;
            inset: 0;
            z-index: 88;
            background: rgba(15, 23, 42, 0.35);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
            display: block;
          }

          .mobile-menu-backdrop.show {
            opacity: 1;
            pointer-events: auto;
          }

          .mobile-side-menu {
            position: fixed;
            top: 0;
            right: 0;
            z-index: 89;
            width: min(82vw, 340px);
            height: 100vh;
            background: #ffffff;
            border-left: 1px solid #e5e7eb;
            box-shadow: -18px 0 40px rgba(15, 23, 42, 0.16);
            transform: translateX(100%);
            transition: transform 0.22s ease;
            display: block;
          }

          .mobile-side-menu.open {
            transform: translateX(0);
          }

          .mobile-side-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 16px;
            border-bottom: 1px solid #e5e7eb;
          }

          .mobile-side-brand {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            color: #0f172a;
          }

          .mobile-side-brand strong {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: -0.03em;
          }

          .mobile-side-close {
            width: 38px;
            height: 38px;
            border: 1px solid #e2e8f0;
            border-radius: 999px;
            background: #ffffff;
            color: #334155;
            font-size: 24px;
            line-height: 1;
            cursor: pointer;
          }

          .mobile-side-nav {
            display: grid;
            padding: 12px;
          }

          .mobile-side-nav a {
  text-decoration: none;
  color: #1d4ed8;
  font-size: 15px;
  font-weight: 800;
  padding: 14px 12px;
  border-radius: 12px;
  border-bottom: 1px solid #f1f5f9;
  transition: color 0.15s ease, background 0.15s ease;
}

          .mobile-side-nav a:hover {
  background: #fff7ed;
  color: #ea580c;
}
        }

        @media (max-width: 420px) {
          .clean-brand-title {
            font-size: 21px;
          }

          .clean-brand-logo {
            width: 42px;
            height: 42px;
          }

          .clean-header-right {
            gap: 8px;
          }

          .os-search-icon-btn,
          .clean-menu-btn {
            width: 38px;
            height: 38px;
          }
        }
      `}</style>
    </>
  );
}