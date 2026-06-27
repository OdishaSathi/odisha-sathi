import Link from "next/link";

const jobSubCategories = [
  "10th Pass Jobs",
  "+2 Jobs",
  "ITI Jobs",
  "Diploma Jobs",
  "Degree Jobs",
  "Govt Jobs",
  "Private Jobs",
  "Odisha Jobs",
  "Central Jobs",
];

export default function JobsPage() {
  return (
    <main style={{ maxWidth: "800px", margin: "30px auto", padding: "20px" }}>
      <h1>Latest Jobs</h1>

      {jobSubCategories.map((item) => (
        <div key={item} style={{ marginBottom: "12px" }}>
          <Link href={`/jobs/${encodeURIComponent(item)}`}>{item}</Link>
        </div>
      ))}
    </main>
  );
}