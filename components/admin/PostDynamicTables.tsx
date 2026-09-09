"use client";

import {
  DATE_TYPE_OPTIONS,
  LINK_TYPE_OPTIONS,
  ImportantDateRow,
  ImportantLinkRow,
  createEmptyDateRow,
  createEmptyLinkRow,
} from "@/lib/postOptions";

type PostDynamicTablesProps = {
  importantDates: ImportantDateRow[];
  importantLinks: ImportantLinkRow[];
  onDatesChange: (rows: ImportantDateRow[]) => void;
  onLinksChange: (rows: ImportantLinkRow[]) => void;
  enableOdia?: boolean;
};

const DATE_PRESETS = [
  "Application Start Date",
  "Last Date",
  "Admit Card Date",
  "Exam Date",
  "Result Date",
  "Custom",
];

const LINK_PRESETS = [
  "Apply Online",
  "Official Notification",
  "Official Website",
  "Download PDF",
  "Download Admit Card",
  "Check Result",
  "Custom",
];

export default function PostDynamicTables({
  importantDates,
  importantLinks,
  onDatesChange,
  onLinksChange,
  enableOdia = false,
}: PostDynamicTablesProps) {
  function updateDateRow(id: string, field: keyof ImportantDateRow, value: string) {
    onDatesChange(
      importantDates.map((row) => {
        if (row.id !== id) return row;
        if (field === "type") {
          return { ...row, type: value, label: value === "Custom" ? "" : value };
        }
        return { ...row, [field]: value };
      })
    );
  }

  function updateLinkRow(id: string, field: keyof ImportantLinkRow, value: string) {
    onLinksChange(
      importantLinks.map((row) => {
        if (row.id !== id) return row;
        if (field === "type") {
          return { ...row, type: value, label: value === "Custom" ? "" : value };
        }
        return { ...row, [field]: value };
      })
    );
  }

  function addDate(type = "Application Start Date") {
    const row = createEmptyDateRow();
    row.type = type;
    row.label = type === "Custom" ? "" : type;
    onDatesChange([...importantDates, row]);
  }

  function addLink(type = "Apply Online") {
    const row = createEmptyLinkRow();
    row.type = type;
    row.label = type === "Custom" ? "" : type;
    onLinksChange([...importantLinks, row]);
  }

  return (
    <div className="dynamic-admin-wrap" data-admin-section="dates-links">
      <section className="dynamic-admin-section">
        <div className="dynamic-admin-head">
          <div>
            <h3>Important Dates</h3>
            <p>Quick-add a common date or choose any type in the row.</p>
          </div>
          <button type="button" className="dynamic-primary" onClick={() => addDate()}>
            + Date
          </button>
        </div>

        <div className="dynamic-presets" aria-label="Quick date presets">
          {DATE_PRESETS.map((type) => (
            <button type="button" key={type} onClick={() => addDate(type)}>
              + {type.replace("Application ", "").replace(" Date", "")}
            </button>
          ))}
        </div>

        <div className="dynamic-row-list">
          {importantDates.length === 0 ? <p className="dynamic-empty">No date rows added.</p> : null}
          {importantDates.map((row, index) => (
            <details className="dynamic-row-card" key={row.id} open={!row.value.trim()}>
              <summary>
                <strong>{row.label || row.type || `Date ${index + 1}`}</strong>
                <span>{row.value || "Add value"}</span>
              </summary>
              <div className="dynamic-row-body">
                <label>
                  Date Type
                  <select value={row.type} onChange={(e) => updateDateRow(row.id, "type", e.target.value)}>
                    {DATE_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                {row.type === "Custom" ? (
                  <label>
                    Custom Label
                    <input value={row.label} onChange={(e) => updateDateRow(row.id, "label", e.target.value)} placeholder="Example: Online Form Reopen Date" />
                  </label>
                ) : null}
                <label>
                  Date / Value
                  <input value={row.value} onChange={(e) => updateDateRow(row.id, "value", e.target.value)} placeholder="30-07-2026 or Coming Soon" />
                </label>
                {enableOdia ? (
                  <label>
                    ଓଡ଼ିଆ Label <small>(optional)</small>
                    <input value={row.labelOdia || ""} onChange={(e) => updateDateRow(row.id, "labelOdia", e.target.value)} placeholder="English label is used when blank" />
                  </label>
                ) : null}
                <button type="button" className="dynamic-danger" onClick={() => onDatesChange(importantDates.filter((item) => item.id !== row.id))}>Remove</button>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="dynamic-admin-section">
        <div className="dynamic-admin-head">
          <div>
            <h3>Important Links</h3>
            <p>Choose a preset and paste the URL. Labels fill automatically.</p>
          </div>
          <button type="button" className="dynamic-primary" onClick={() => addLink()}>
            + Link
          </button>
        </div>

        <div className="dynamic-presets" aria-label="Quick link presets">
          {LINK_PRESETS.map((type) => (
            <button type="button" key={type} onClick={() => addLink(type)}>
              + {type.replace("Official ", "").replace("Download ", "")}
            </button>
          ))}
        </div>

        <div className="dynamic-row-list">
          {importantLinks.length === 0 ? <p className="dynamic-empty">No link rows added.</p> : null}
          {importantLinks.map((row, index) => (
            <details className="dynamic-row-card" key={row.id} open={!row.url.trim()}>
              <summary>
                <strong>{row.label || row.type || `Link ${index + 1}`}</strong>
                <span>{row.url ? "URL added" : "Add URL"}</span>
              </summary>
              <div className="dynamic-row-body">
                <label>
                  Link Type
                  <select value={row.type} onChange={(e) => updateLinkRow(row.id, "type", e.target.value)}>
                    {LINK_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                {row.type === "Custom" ? (
                  <label>
                    Custom Label
                    <input value={row.label} onChange={(e) => updateLinkRow(row.id, "label", e.target.value)} placeholder="Example: District Wise Vacancy" />
                  </label>
                ) : null}
                <label>
                  Link URL
                  <input type="url" value={row.url} onChange={(e) => updateLinkRow(row.id, "url", e.target.value)} placeholder="https://example.com" />
                </label>
                {enableOdia ? (
                  <label>
                    ଓଡ଼ିଆ Label <small>(optional)</small>
                    <input value={row.labelOdia || ""} onChange={(e) => updateLinkRow(row.id, "labelOdia", e.target.value)} placeholder="English label is used when blank" />
                  </label>
                ) : null}
                <button type="button" className="dynamic-danger" onClick={() => onLinksChange(importantLinks.filter((item) => item.id !== row.id))}>Remove</button>
              </div>
            </details>
          ))}
        </div>
      </section>

      <style jsx>{`
        .dynamic-admin-wrap{display:grid;gap:12px}.dynamic-admin-section{border:1px solid #e5e7eb;border-radius:13px;background:#fff;padding:12px}.dynamic-admin-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}.dynamic-admin-head h3{margin:0;color:#0f172a;font-size:16px;font-weight:900}.dynamic-admin-head p{margin:3px 0 0;color:#64748b;font-size:12px}.dynamic-primary,.dynamic-presets button,.dynamic-danger{border:1px solid #cbd5e1;border-radius:999px;padding:7px 10px;background:#fff;color:#1d4ed8;font-size:12px;font-weight:850;cursor:pointer}.dynamic-primary{border-color:#2563eb;background:#2563eb;color:#fff}.dynamic-danger{border-color:#fecaca;background:#fff1f2;color:#be123c}.dynamic-presets{display:flex;gap:6px;overflow-x:auto;padding:9px 0 2px;scrollbar-width:thin}.dynamic-presets button{flex:0 0 auto;background:#f8fafc}.dynamic-row-list{display:grid;gap:8px;margin-top:10px}.dynamic-row-card{border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;overflow:hidden}.dynamic-row-card summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 10px;cursor:pointer}.dynamic-row-card summary::-webkit-details-marker{display:none}.dynamic-row-card summary strong{font-size:12.5px;color:#0f172a}.dynamic-row-card summary span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#64748b;font-size:11.5px}.dynamic-row-body{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;padding:9px;border-top:1px solid #e2e8f0;background:#fff}.dynamic-row-body label{display:grid;gap:4px;color:#334155;font-size:12px;font-weight:800}.dynamic-row-body small{color:#64748b}.dynamic-row-body input,.dynamic-row-body select{width:100%;box-sizing:border-box;min-height:38px;border:1px solid #cbd5e1;border-radius:8px;padding:7px 9px;background:#fff;color:#0f172a;font:inherit}.dynamic-row-body .dynamic-danger{align-self:end}.dynamic-empty{margin:0;padding:9px;border-radius:8px;background:#f8fafc;color:#64748b;font-size:12px}@media(max-width:600px){.dynamic-admin-section{padding:10px}.dynamic-primary{min-width:72px}.dynamic-row-body{grid-template-columns:1fr}.dynamic-row-body .dynamic-danger{width:100%}}
      `}</style>
    </div>
  );
}
