export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h3>Odisha Sathi</h3>
          <p>Your trusted place for Odisha jobs, exams, results, admissions, scholarships and government scheme updates.</p>
        </div>
        <div>
          <h4>Follow Us</h4>
          <p>WhatsApp Channel: Odisha Sathi</p>
          <p>Stay connected for daily updates.</p>
        </div>
        <div>
          <h4>Janaseva Kendra</h4>
          <p>Get all your online work done under one roof.</p>
          <p>Nabarangpur, Odisha</p>
        </div>
      </div>
      <div className="copyright">© {new Date().getFullYear()} Odisha Sathi. All rights reserved.</div>
    </footer>
  );
}
