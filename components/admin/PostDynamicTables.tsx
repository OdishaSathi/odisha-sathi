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
};

export default function PostDynamicTables({
  importantDates,
  importantLinks,
  onDatesChange,
  onLinksChange,
}: PostDynamicTablesProps) {
  function updateDateRow(
    id: string,
    field: keyof ImportantDateRow,
    value: string
  ) {
    onDatesChange(
      importantDates.map((row) => {
        if (row.id !== id) return row;

        if (field === "type") {
          return {
            ...row,
            type: value,
            label: value === "Custom" ? "" : value,
          };
        }

        return {
          ...row,
          [field]: value,
        };
      })
    );
  }

  function updateLinkRow(
    id: string,
    field: keyof ImportantLinkRow,
    value: string
  ) {
    onLinksChange(
      importantLinks.map((row) => {
        if (row.id !== id) return row;

        if (field === "type") {
          return {
            ...row,
            type: value,
            label: value === "Custom" ? "" : value,
          };
        }

        return {
          ...row,
          [field]: value,
        };
      })
    );
  }

  function removeDateRow(id: string) {
    onDatesChange(importantDates.filter((row) => row.id !== id));
  }

  function removeLinkRow(id: string) {
    onLinksChange(importantLinks.filter((row) => row.id !== id));
  }

  return (
    <div style={{ display: "grid", gap: "22px" }}>
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h3 style={sectionTitleStyle}>Important Dates</h3>
            <p style={sectionTextStyle}>
              Select date type and enter date/value. Use Custom for special
              labels.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onDatesChange([...importantDates, createEmptyDateRow()])}
            style={addButtonStyle}
          >
            + Add Date
          </button>
        </div>

        <div style={{ display: "grid", gap: "12px" }}>
          {importantDates.length === 0 ? (
            <p style={emptyTextStyle}>No date rows added.</p>
          ) : null}

          {importantDates.map((row, index) => (
            <div key={row.id} style={rowCardStyle}>
              <div style={rowTopStyle}>
                <strong style={{ color: "#0f172a" }}>Date Row {index + 1}</strong>

                <button
                  type="button"
                  onClick={() => removeDateRow(row.id)}
                  style={removeButtonStyle}
                >
                  Remove
                </button>
              </div>

              <div style={gridStyle}>
                <label style={labelStyle}>
                  Date Type
                  <select
                    value={row.type}
                    onChange={(e) =>
                      updateDateRow(row.id, "type", e.target.value)
                    }
                    style={inputStyle}
                  >
                    {DATE_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                {row.type === "Custom" ? (
                  <label style={labelStyle}>
                    Custom Date Label
                    <input
                      value={row.label}
                      onChange={(e) =>
                        updateDateRow(row.id, "label", e.target.value)
                      }
                      placeholder="Example: Online Form Reopen Date"
                      style={inputStyle}
                    />
                  </label>
                ) : null}

                <label style={labelStyle}>
                  Date / Value
                  <input
                    value={row.value}
                    onChange={(e) =>
                      updateDateRow(row.id, "value", e.target.value)
                    }
                    placeholder="Example: 30-07-2026 or Coming Soon"
                    style={inputStyle}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h3 style={sectionTitleStyle}>Important Links</h3>
            <p style={sectionTextStyle}>
              Select link type and paste URL. Use Custom for special link names.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onLinksChange([...importantLinks, createEmptyLinkRow()])}
            style={addButtonStyle}
          >
            + Add Link
          </button>
        </div>

        <div style={{ display: "grid", gap: "12px" }}>
          {importantLinks.length === 0 ? (
            <p style={emptyTextStyle}>No link rows added.</p>
          ) : null}

          {importantLinks.map((row, index) => (
            <div key={row.id} style={rowCardStyle}>
              <div style={rowTopStyle}>
                <strong style={{ color: "#0f172a" }}>Link Row {index + 1}</strong>

                <button
                  type="button"
                  onClick={() => removeLinkRow(row.id)}
                  style={removeButtonStyle}
                >
                  Remove
                </button>
              </div>

              <div style={gridStyle}>
                <label style={labelStyle}>
                  Link Type
                  <select
                    value={row.type}
                    onChange={(e) =>
                      updateLinkRow(row.id, "type", e.target.value)
                    }
                    style={inputStyle}
                  >
                    {LINK_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                {row.type === "Custom" ? (
                  <label style={labelStyle}>
                    Custom Link Label
                    <input
                      value={row.label}
                      onChange={(e) =>
                        updateLinkRow(row.id, "label", e.target.value)
                      }
                      placeholder="Example: District Wise Vacancy"
                      style={inputStyle}
                    />
                  </label>
                ) : null}

                <label style={labelStyle}>
                  Link URL
                  <input
                    value={row.url}
                    onChange={(e) =>
                      updateLinkRow(row.id, "url", e.target.value)
                    }
                    placeholder="https://example.com"
                    style={inputStyle}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  background: "#ffffff",
  padding: "16px",
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "14px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 900,
  color: "#111827",
};

const sectionTextStyle: React.CSSProperties = {
  margin: "5px 0 0",
  fontSize: "13px",
  color: "#64748b",
  lineHeight: 1.45,
};

const addButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "999px",
  background: "#2563eb",
  color: "#ffffff",
  padding: "9px 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const removeButtonStyle: React.CSSProperties = {
  border: "1px solid #fecaca",
  borderRadius: "999px",
  background: "#fff1f2",
  color: "#be123c",
  padding: "7px 11px",
  fontWeight: 800,
  cursor: "pointer",
};

const rowCardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  background: "#f8fafc",
  padding: "12px",
};

const rowTopStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  alignItems: "center",
  marginBottom: "10px",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: "6px",
  fontSize: "13px",
  fontWeight: 800,
  color: "#334155",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "42px",
  border: "1px solid #cbd5e1",
  borderRadius: "12px",
  padding: "9px 11px",
  fontSize: "14px",
  color: "#0f172a",
  background: "#ffffff",
  outline: "none",
};

const emptyTextStyle: React.CSSProperties = {
  margin: 0,
  padding: "12px",
  borderRadius: "12px",
  background: "#f8fafc",
  color: "#64748b",
  fontSize: "14px",
};