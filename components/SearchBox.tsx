"use client";

import { useState } from "react";

export default function SearchBox() {
  const [search, setSearch] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    const query = search.trim();

    if (!query) return;

    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  }

  return (
    <form className="home-search-box" onSubmit={handleSearch}>
      <input
        type="search"
        placeholder="Search jobs, exams, results, admissions..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search Odisha Sathi"
      />
      <button type="submit">Search</button>
    </form>
  );
}