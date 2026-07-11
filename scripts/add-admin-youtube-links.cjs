const fs = require("fs");
const path = require("path");

const root = process.cwd();

function filePath(rel) {
  return path.join(root, rel);
}

function exists(rel) {
  return fs.existsSync(filePath(rel));
}

function read(rel) {
  return fs.readFileSync(filePath(rel), "utf8").replace(/\r\n/g, "\n");
}

function write(rel, content) {
  fs.writeFileSync(filePath(rel), content.replace(/\r\n/g, "\n"), "utf8");
  console.log("Patched:", rel);
}

function requireText(content, text, rel) {
  if (!content.includes(text)) {
    throw new Error(`Expected text not found in ${rel}:\n${text.slice(0, 160)}`);
  }
}

function patchTypeFile(rel) {
  if (!exists(rel)) return;

  let c = read(rel);

  if (c.includes("youtubeUrls?: string[]")) return;

  c = c.replace(
    /(youtubeUrl\??:\s*string;\s*\n)/,
    `$1  youtubeUrls?: string[];\n`
  );

  write(rel, c);
}

function patchResultOrAdmitForm(rel, name, slugFn) {
  let c = read(rel);

  c = c.replace(/(  youtubeUrl: "",\n)(?!  youtubeUrls)/, "$1  youtubeUrls: [],\n");

  const updateNeedle = `  };\n\n  const updateLink`;

  if (!c.includes("const updateYoutubeUrl = (index: number, value: string)")) {
    requireText(c, updateNeedle, rel);

    c = c.replace(
      updateNeedle,
      `  };\n\n  const updateYoutubeUrl = (index: number, value: string) => {\n    setFormData((prev) => {\n      const currentUrls = Array.isArray((prev as any).youtubeUrls)\n        ? [...((prev as any).youtubeUrls as string[])]\n        : [];\n\n      currentUrls[index] = value;\n\n      return {\n        ...prev,\n        youtubeUrls: currentUrls,\n      } as ${name};\n    });\n  };\n\n  const updateLink`
    );
  }

  if (!c.includes("const cleanedYoutubeUrls = Array.isArray((formData as any).youtubeUrls)")) {
    c = c.replace(
      `    try {\n      await onSubmit({`,
      `    try {\n      const cleanedYoutubeUrls = Array.isArray((formData as any).youtubeUrls)\n        ? ((formData as any).youtubeUrls as string[])\n            .map((item) => item.trim())\n            .filter(Boolean)\n            .slice(0, 2)\n        : [];\n\n      await onSubmit({`
    );
  }

  const slugLine = `        slug: ${slugFn}(formData.slug || formData.title),\n`;

  if (!c.includes("youtubeUrls: cleanedYoutubeUrls,")) {
    requireText(c, slugLine, rel);

    c = c.replace(
      slugLine,
      `${slugLine}        youtubeUrl: (formData.youtubeUrl || "").trim(),\n        youtubeUrls: cleanedYoutubeUrls,\n`
    );
  }

  const oldBlock = `        <div className="admin-form-group">\n          <label>YouTube Link</label>\n          <input\n            type="url"\n            value={formData.youtubeUrl || ""}\n            onChange={(event) => updateField("youtubeUrl", event.target.value)}\n            placeholder="https://youtube.com/..."\n          />\n        </div>`;

  const newBlock = `        <div className="admin-form-group">\n          <label>YouTube Video 1</label>\n          <input\n            type="url"\n            value={formData.youtubeUrl || ""}\n            onChange={(event) => updateField("youtubeUrl", event.target.value)}\n            placeholder="https://youtube.com/..."\n          />\n        </div>\n\n        <div className="admin-form-group">\n          <label>YouTube Video 2</label>\n          <input\n            type="url"\n            value={((formData as any).youtubeUrls || [])[0] || ""}\n            onChange={(event) => updateYoutubeUrl(0, event.target.value)}\n            placeholder="https://youtube.com/..."\n          />\n        </div>\n\n        <div className="admin-form-group">\n          <label>YouTube Video 3</label>\n          <input\n            type="url"\n            value={((formData as any).youtubeUrls || [])[1] || ""}\n            onChange={(event) => updateYoutubeUrl(1, event.target.value)}\n            placeholder="https://youtube.com/..."\n          />\n        </div>`;

  if (c.includes(oldBlock)) {
    c = c.replace(oldBlock, newBlock);
  }

  write(rel, c);
}

function patchSimpleEditForm(rel, sectionLabel) {
  let c = read(rel);

  if (!c.includes('const [youtubeUrl, setYoutubeUrl] = useState("");')) {
    c = c.replace(
      `  const [content, setContent] = useState("");\n`,
      `  const [content, setContent] = useState("");\n  const [youtubeUrl, setYoutubeUrl] = useState("");\n  const [youtubeUrl2, setYoutubeUrl2] = useState("");\n  const [youtubeUrl3, setYoutubeUrl3] = useState("");\n`
    );
  }

  if (!c.includes('setYoutubeUrl(data.youtubeUrl || "");')) {
    c = c.replace(
      `        setContent(data.content || "");\n`,
      `        setContent(data.content || data.description || "");\n\n        const savedYoutubeUrls = Array.isArray(data.youtubeUrls)\n          ? data.youtubeUrls\n          : [];\n\n        setYoutubeUrl(data.youtubeUrl || "");\n        setYoutubeUrl2(savedYoutubeUrls[0] || data.youtubeUrl2 || data.videoUrl2 || "");\n        setYoutubeUrl3(savedYoutubeUrls[1] || data.youtubeUrl3 || data.videoUrl3 || "");\n`
    );
  }

  if (!c.includes("const cleanedYoutubeUrls = [youtubeUrl2, youtubeUrl3]")) {
    c = c.replace(
      `      await updateDoc(doc(db, "posts", routeId), {`,
      `      const cleanedYoutubeUrls = [youtubeUrl2, youtubeUrl3]\n        .map((item) => item.trim())\n        .filter(Boolean);\n\n      await updateDoc(doc(db, "posts", routeId), {`
    );
  }

  if (!c.includes("youtubeUrls: cleanedYoutubeUrls,")) {
    c = c.replace(
      `        content: content.trim(),\n`,
      `        content: content.trim(),\n        description: content.trim(),\n        youtubeUrl: youtubeUrl.trim(),\n        youtubeUrls: cleanedYoutubeUrls,\n`
    );
  }

  const oldUiNeedle = `      <div>\n        <label>${sectionLabel} Subcategories</label>`;

  const videoUi = `      <div\n        style={{\n          display: "grid",\n          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",\n          gap: "14px",\n        }}\n      >\n        <div>\n          <label>YouTube Video 1</label>\n          <input\n            type="url"\n            placeholder="https://www.youtube.com/watch?v=..."\n            value={youtubeUrl}\n            onChange={(e) => setYoutubeUrl(e.target.value)}\n            style={{\n              width: "100%",\n              padding: "12px",\n              marginTop: "6px",\n              border: "1px solid #ddd",\n              borderRadius: "8px",\n            }}\n          />\n        </div>\n\n        <div>\n          <label>YouTube Video 2</label>\n          <input\n            type="url"\n            placeholder="https://www.youtube.com/watch?v=..."\n            value={youtubeUrl2}\n            onChange={(e) => setYoutubeUrl2(e.target.value)}\n            style={{\n              width: "100%",\n              padding: "12px",\n              marginTop: "6px",\n              border: "1px solid #ddd",\n              borderRadius: "8px",\n            }}\n          />\n        </div>\n\n        <div>\n          <label>YouTube Video 3</label>\n          <input\n            type="url"\n            placeholder="https://www.youtube.com/watch?v=..."\n            value={youtubeUrl3}\n            onChange={(e) => setYoutubeUrl3(e.target.value)}\n            style={{\n              width: "100%",\n              padding: "12px",\n              marginTop: "6px",\n              border: "1px solid #ddd",\n              borderRadius: "8px",\n            }}\n          />\n        </div>\n      </div>\n\n${oldUiNeedle}`;

  if (!c.includes("<label>YouTube Video 1</label>")) {
    c = c.replace(oldUiNeedle, videoUi);
  }

  write(rel, c);
}

function patchAdmissionsPage(rel, isEdit) {
  let c = read(rel);

  c = c.replace(/(  youtubeUrl: string;\n)(?!  youtubeUrls)/, "$1  youtubeUrls: string[];\n");
  c = c.replace(/(  youtubeUrl: "",\n)(?!  youtubeUrls)/, "$1  youtubeUrls: [],\n");

  if (!c.includes("youtubeUrls: form.youtubeUrls")) {
    c = c.replace(
      `    youtubeUrl: form.youtubeUrl.trim(),\n`,
      `    youtubeUrl: form.youtubeUrl.trim(),\n    youtubeUrls: form.youtubeUrls.map((item) => item.trim()).filter(Boolean).slice(0, 2),\n`
    );
  }

  if (isEdit && !c.includes("youtubeUrls: Array.isArray(data.youtubeUrls)")) {
    c = c.replace(
      `          youtubeUrl: data.youtubeUrl || "",\n`,
      `          youtubeUrl: data.youtubeUrl || "",\n          youtubeUrls: Array.isArray(data.youtubeUrls)\n            ? data.youtubeUrls\n            : [],\n`
    );
  }

  const oldBlock = `              <div>\n                <label style={labelStyle}>YouTube Video Link</label>\n                <input\n                  type="url"\n                  value={form.youtubeUrl}\n                  onChange={(event) =>\n                    handleChange("youtubeUrl", event.target.value)\n                  }\n                  placeholder="https://youtube.com/..."\n                  style={inputStyle}\n                />\n              </div>`;

  const newBlock = `              <div>\n                <label style={labelStyle}>YouTube Video 1</label>\n                <input\n                  type="url"\n                  value={form.youtubeUrl}\n                  onChange={(event) =>\n                    handleChange("youtubeUrl", event.target.value)\n                  }\n                  placeholder="https://youtube.com/..."\n                  style={inputStyle}\n                />\n              </div>\n\n              <div>\n                <label style={labelStyle}>YouTube Video 2</label>\n                <input\n                  type="url"\n                  value={form.youtubeUrls[0] || ""}\n                  onChange={(event) => {\n                    const nextUrls = [...form.youtubeUrls];\n                    nextUrls[0] = event.target.value;\n                    handleChange("youtubeUrls", nextUrls);\n                  }}\n                  placeholder="https://youtube.com/..."\n                  style={inputStyle}\n                />\n              </div>\n\n              <div>\n                <label style={labelStyle}>YouTube Video 3</label>\n                <input\n                  type="url"\n                  value={form.youtubeUrls[1] || ""}\n                  onChange={(event) => {\n                    const nextUrls = [...form.youtubeUrls];\n                    nextUrls[1] = event.target.value;\n                    handleChange("youtubeUrls", nextUrls);\n                  }}\n                  placeholder="https://youtube.com/..."\n                  style={inputStyle}\n                />\n              </div>`;

  if (c.includes(oldBlock)) {
    c = c.replace(oldBlock, newBlock);
  }

  write(rel, c);
}

function patchSchemeForm(rel, isEdit) {
  let c = read(rel);

  if (!c.includes('const [youtubeUrl2, setYoutubeUrl2] = useState("");')) {
    c = c.replace(
      `  const [youtubeUrl, setYoutubeUrl] = useState("");\n`,
      `  const [youtubeUrl, setYoutubeUrl] = useState("");\n  const [youtubeUrl2, setYoutubeUrl2] = useState("");\n  const [youtubeUrl3, setYoutubeUrl3] = useState("");\n`
    );
  }

  if (isEdit && !c.includes("const savedYoutubeUrls = Array.isArray(data.youtubeUrls)")) {
    c = c.replace(
      `        setYoutubeUrl(data.youtubeUrl || "");\n`,
      `        const savedYoutubeUrls = Array.isArray(data.youtubeUrls)\n          ? data.youtubeUrls\n          : [];\n\n        setYoutubeUrl(data.youtubeUrl || "");\n        setYoutubeUrl2(savedYoutubeUrls[0] || data.youtubeUrl2 || data.videoUrl2 || "");\n        setYoutubeUrl3(savedYoutubeUrls[1] || data.youtubeUrl3 || data.videoUrl3 || "");\n`
    );
  }

  if (!c.includes("const cleanedYoutubeUrls = [youtubeUrl2, youtubeUrl3]")) {
    c = c.replace(
      `      const importantLinks = [`,
      `      const cleanedYoutubeUrls = [youtubeUrl2, youtubeUrl3]\n        .map((item) => item.trim())\n        .filter(Boolean);\n\n      const importantLinks = [`
    );
  }

  if (!c.includes("youtubeUrls: cleanedYoutubeUrls,")) {
    c = c.replace(
      `        youtubeUrl: youtubeUrl.trim(),\n`,
      `        youtubeUrl: youtubeUrl.trim(),\n        youtubeUrls: cleanedYoutubeUrls,\n`
    );
  }

  if (!isEdit && !c.includes('setYoutubeUrl2("");')) {
    c = c.replace(
      `      setYoutubeUrl("");\n`,
      `      setYoutubeUrl("");\n      setYoutubeUrl2("");\n      setYoutubeUrl3("");\n`
    );
  }

  const styleCall = isEdit ? "fieldStyle()" : "fieldStyle";

  const oldBlock = `      <div>\n        <label>YouTube Video Link</label>\n        <input\n          type="url"\n          placeholder="https://www.youtube.com/watch?v=..."\n          value={youtubeUrl}\n          onChange={(e) => setYoutubeUrl(e.target.value)}\n          style={${styleCall}}\n        />\n      </div>`;

  const newBlock = `      <div\n        style={{\n          display: "grid",\n          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",\n          gap: "14px",\n        }}\n      >\n        <div>\n          <label>YouTube Video 1</label>\n          <input\n            type="url"\n            placeholder="https://www.youtube.com/watch?v=..."\n            value={youtubeUrl}\n            onChange={(e) => setYoutubeUrl(e.target.value)}\n            style={${styleCall}}\n          />\n        </div>\n\n        <div>\n          <label>YouTube Video 2</label>\n          <input\n            type="url"\n            placeholder="https://www.youtube.com/watch?v=..."\n            value={youtubeUrl2}\n            onChange={(e) => setYoutubeUrl2(e.target.value)}\n            style={${styleCall}}\n          />\n        </div>\n\n        <div>\n          <label>YouTube Video 3</label>\n          <input\n            type="url"\n            placeholder="https://www.youtube.com/watch?v=..."\n            value={youtubeUrl3}\n            onChange={(e) => setYoutubeUrl3(e.target.value)}\n            style={${styleCall}}\n          />\n        </div>\n      </div>`;

  if (c.includes(oldBlock)) {
    c = c.replace(oldBlock, newBlock);
  }

  write(rel, c);
}

patchTypeFile("types/result.ts");
patchTypeFile("types/admitCard.ts");

patchResultOrAdmitForm("components/admin/ResultForm.tsx", "ResultPost", "createResultSlug");
patchSimpleEditForm("components/forms/EditResultForm.tsx", "Result");

patchResultOrAdmitForm("components/admin/AdmitCardForm.tsx", "AdmitCard", "createAdmitCardSlug");
patchSimpleEditForm("components/forms/EditAdmitCardForm.tsx", "Admit Card");

patchAdmissionsPage("app/admin/admissions/page.tsx", false);
patchAdmissionsPage("app/admin/admissions/edit/[id]/page.tsx", true);

patchSchemeForm("components/forms/SchemeForm.tsx", false);
patchSchemeForm("components/forms/EditSchemeForm.tsx", true);

console.log("\nDone. Now run npm run dev, then npm run build.");