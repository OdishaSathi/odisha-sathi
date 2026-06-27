"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

type PostItem = {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  content?: string;
  schemeName?: string;
  department?: string;
  createdAt?: any;
};

function SectionCard({
  title,
  viewAllLink,
  items,
  emptyText,
  isScheme = false,
}: {
  title: string;
  viewAllLink: string;
  items: PostItem[];
  emptyText: string;
  isScheme?: boolean;
}) {
  return (
    <section className="home-section-card">
      <div className="home-section-head">
        <h2>{title}</h2>

        <Link href={viewAllLink} className="home-view-all">
          View All
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="home-empty-text">{emptyText}</p>
      ) : (
        <div className="home-post-list">
          {items.map((item) => {
            const displayTitle = isScheme
              ? item.schemeName || item.title || "Untitled Scheme"
              : item.title || "Untitled Post";

            const linkHref = isScheme
              ? `/schemes/${item.id}`
              : `/post/${item.slug || item.id}`;

            return (
              <Link key={item.id} href={linkHref} className="home-post-card">
                <h3>{displayTitle}</h3>

                {isScheme ? (
                  <p>{item.department || "Department not added"}</p>
                ) : item.content ? (
                  <p>
                    {item.content.length > 90
                      ? `${item.content.slice(0, 90)}...`
                      : item.content}
                  </p>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const [jobs, setJobs] = useState<PostItem[]>([]);
  const [results, setResults] = useState<PostItem[]>([]);
  const [admissions, setAdmissions] = useState<PostItem[]>([]);
  const [admitCards, setAdmitCards] = useState<PostItem[]>([]);
  const [schemes, setSchemes] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomePosts = async () => {
      try {
        setLoading(true);

        const snapshot = await getDocs(collection(db, "posts"));

        const allPosts: PostItem[] = snapshot.docs
          .map((docItem) => {
            const data = docItem.data();

            return {
              id: docItem.id,
              title: data.title || "",
              slug: data.slug || "",
              category: data.category || "",
              content: data.content || data.description || "",
              schemeName: data.schemeName || data.title || "",
              department: data.department || "",
              createdAt: data.createdAt || null,
            };
          })
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          });

        setJobs(allPosts.filter((item) => item.category === "jobs").slice(0, 5));

        setResults(
          allPosts.filter((item) => item.category === "results").slice(0, 5)
        );

        setAdmissions(
          allPosts.filter((item) => item.category === "admissions").slice(0, 5)
        );

        setAdmitCards(
          allPosts.filter((item) => item.category === "admit-cards").slice(0, 5)
        );

        setSchemes(
          allPosts.filter((item) => item.category === "schemes").slice(0, 5)
        );
      } catch (error) {
        console.error(error);
        alert("Failed to load home page posts");
      } finally {
        setLoading(false);
      }
    };

    loadHomePosts();
  }, []);

  return (
    <main className="home-page-main">
      <section className="home-hero-card">
        <h1>Odisha Sathi</h1>

        <p>
          Latest updates for jobs, results, admissions, admit cards and
          government schemes.
        </p>
      </section>

      <section className="home-quick-grid">
        <Link href="/jobs" className="home-quick-link">
          Jobs
        </Link>
        <Link href="/results" className="home-quick-link">
          Results
        </Link>
        <Link href="/admissions" className="home-quick-link">
          Admissions
        </Link>
        <Link href="/admit-cards" className="home-quick-link">
          Admit Cards
        </Link>
        <Link href="/schemes" className="home-quick-link">
          Schemes
        </Link>
        <Link href="/tools" className="home-quick-link">
          Tools
        </Link>
      </section>

      {loading ? (
        <div className="home-loading-card">
          <p>Loading latest updates...</p>
        </div>
      ) : (
        <div className="home-latest-grid">
          <SectionCard
            title="Latest Jobs"
            viewAllLink="/jobs"
            items={jobs}
            emptyText="No jobs added yet."
          />

          <SectionCard
            title="Latest Results"
            viewAllLink="/results"
            items={results}
            emptyText="No results added yet."
          />

          <SectionCard
            title="Latest Admissions"
            viewAllLink="/admissions"
            items={admissions}
            emptyText="No admissions added yet."
          />

          <SectionCard
            title="Latest Admit Cards"
            viewAllLink="/admit-cards"
            items={admitCards}
            emptyText="No admit cards added yet."
          />

          <SectionCard
            title="Government Schemes"
            viewAllLink="/schemes"
            items={schemes}
            emptyText="No schemes added yet."
            isScheme
          />
        </div>
      )}
    </main>
  );
}