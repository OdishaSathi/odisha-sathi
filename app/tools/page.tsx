import ImageResizeTool from "./components/ImageResizeTool";

export default function ToolsPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>Online Tools</h1>
          <p>Useful tools for online forms, applications and admission work.</p>
        </div>
      </section>
      <section className="section container">
        <div className="info-grid" style={{ marginBottom: 22 }}>
          <div className="info-card"><h3>Image Resize</h3><p>Resize images for forms and uploads.</p></div>
          <div className="info-card"><h3>Passport Photo</h3><p>Prepare passport photo prompts and guidelines.</p></div>
          <div className="info-card"><h3>Form Checklist</h3><p>Keep documents ready before applying online.</p></div>
          <div className="info-card"><h3>Odisha Sathi</h3><p>Follow for daily public updates.</p></div>
        </div>
        <ImageResizeTool />
      </section>
    </>
  );
}
