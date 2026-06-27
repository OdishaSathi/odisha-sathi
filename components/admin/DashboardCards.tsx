"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getCountFromServer,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DashboardCards() {
  const [counts, setCounts] = useState({
    jobs: 0,
    results: 0,
    admissions: 0,
    admitCards: 0,
    schemes: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const postsRef = collection(db, "posts");

        const jobsQuery = query(postsRef, where("category", "==", "jobs"));
        const resultsQuery = query(postsRef, where("category", "==", "results"));
        const admissionsQuery = query(
          postsRef,
          where("category", "==", "admissions")
        );
        const admitCardsQuery = query(
          postsRef,
          where("category", "==", "admit-cards")
        );
        const schemesQuery = query(postsRef, where("category", "==", "schemes"));

        const [
          jobsSnapshot,
          resultsSnapshot,
          admissionsSnapshot,
          admitCardsSnapshot,
          schemesSnapshot,
        ] = await Promise.all([
          getCountFromServer(jobsQuery),
          getCountFromServer(resultsQuery),
          getCountFromServer(admissionsQuery),
          getCountFromServer(admitCardsQuery),
          getCountFromServer(schemesQuery),
        ]);

        setCounts({
          jobs: jobsSnapshot.data().count,
          results: resultsSnapshot.data().count,
          admissions: admissionsSnapshot.data().count,
          admitCards: admitCardsSnapshot.data().count,
          schemes: schemesSnapshot.data().count,
        });
      } catch (error) {
        console.error("Dashboard count error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCounts();
  }, []);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "20px",
        marginTop: "25px",
      }}
    >
      <DashboardCard title="Total Jobs" count={counts.jobs} />
      <DashboardCard title="Results" count={counts.results} />
      <DashboardCard title="Admissions" count={counts.admissions} />
      <DashboardCard title="Admit Cards" count={counts.admitCards} />
      <DashboardCard title="Schemes" count={counts.schemes} />
    </div>
  );
}

function DashboardCard({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        padding: "20px",
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
      }}
    >
      <h3 style={{ margin: 0 }}>{title}</h3>

      <p
        style={{
          fontSize: "32px",
          fontWeight: "bold",
          marginTop: "10px",
          marginBottom: 0,
        }}
      >
        {count}
      </p>
    </div>
  );
}