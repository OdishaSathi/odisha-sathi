import Link from "next/link";
import CategoryPills from "@/components/CategoryPills";
import LatestPosts from "@/components/LatestPosts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1>Odisha Sathi</h1>
            <p>Latest Odisha updates for government jobs, running and upcoming exams, results, scholarships, admissions and government schemes.</p>
            <div className="hero-actions">
              <Link className="btn secondary" href="#latest">See Latest Updates</Link>
              <Link className="btn" href="/tools">Use Free Tools</Link>
            </div>
          </div>
          <div className="hero-card">
            <h2>Follow our WhatsApp Channel</h2>
            <ul>
              <li>Govt. job alerts</li>
              <li>Exam notifications and admit cards</li>
              <li>Results and merit lists</li>
              <li>Scholarships and govt. schemes</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-title">
          <div>
            <h2>Browse Categories</h2>
            <p>Find updates quickly by topic.</p>
          </div>
        </div>
        <CategoryPills />
      </section>

      <section className="section container" id="latest">
        <div className="section-title">
          <div>
            <h2>Latest Updates</h2>
            <p>Fresh posts from Odisha Sathi.</p>
          </div>
          <Link href="/category/jobs" className="btn outline">View Jobs</Link>
        </div>
        <LatestPosts />
      </section>

      <section className="section container">
        <div className="info-grid">
          <div className="info-card"><h3>Jobs</h3><p>OSSC, OSSSC, SSC, railway, bank, local Nabarangpur updates.</p></div>
          <div className="info-card"><h3>Admissions</h3><p>+2, +3, Nursing, OJEE, IGNOU and other admission notices.</p></div>
          <div className="info-card"><h3>Results</h3><p>Board, entrance, recruitment and selection list updates.</p></div>
          <div className="info-card"><h3>Tools</h3><p>Image resize/crop and passport photo guidance for online forms.</p></div>
        </div>
      </section>
    </>
  );
}