"use client";

import { FormEvent, useRef, useState } from "react";

export default function SearchBox() {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function openSearch() {
    setIsOpen(true);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }

  function closeSearch() {
    setIsOpen(false);
    setSearch("");
  }

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const query = search.trim();

    if (!query) {
      openSearch();
      return;
    }

    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  }

  return (
    <div className={`os-search-wrap ${isOpen ? "os-search-open" : ""}`}>
      {!isOpen ? (
        <button
          type="button"
          className="os-search-icon-btn"
          onClick={openSearch}
          aria-label="Open search"
          title="Search"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10.75 4a6.75 6.75 0 0 1 5.33 10.89l3.26 3.25a.85.85 0 0 1-1.2 1.2l-3.25-3.26A6.75 6.75 0 1 1 10.75 4Zm0 1.7a5.05 5.05 0 1 0 0 10.1 5.05 5.05 0 0 0 0-10.1Z" />
          </svg>
        </button>
      ) : (
        <form className="os-search-form" onSubmit={handleSearch}>
          <input
            ref={inputRef}
            type="search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search Odisha Sathi"
          />

          <button type="submit" className="os-search-submit" aria-label="Search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10.75 4a6.75 6.75 0 0 1 5.33 10.89l3.26 3.25a.85.85 0 0 1-1.2 1.2l-3.25-3.26A6.75 6.75 0 1 1 10.75 4Zm0 1.7a5.05 5.05 0 1 0 0 10.1 5.05 5.05 0 0 0 0-10.1Z" />
            </svg>
          </button>

          <button
            type="button"
            className="os-search-close"
            onClick={closeSearch}
            aria-label="Close search"
          >
            ×
          </button>
        </form>
      )}
    </div>
  );
}