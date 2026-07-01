"use client";

import {
  QUICK_INFO_TYPE_OPTIONS,
  QuickInfoRow,
  createEmptyQuickInfoRow,
} from "@/lib/postOptions";

type JobQuickInfoTableProps = {
  quickInfoRows: QuickInfoRow[];
  onChange: (rows: QuickInfoRow[]) => void;
};

export default function JobQuickInfoTable({
  quickInfoRows,
  onChange,
}: JobQuickInfoTableProps) {
  function updateRow(id: string, field: keyof QuickInfoRow, value: string) {
    onChange(
      quickInfoRows.map((row) => {
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

  function removeRow(id: string) {
    onChange(quickInfoRows.filter((row) => row.id !== id));
  }

  return (
    <section style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h3 style={sectionTitleStyle}>Quick Information</h3>
          <p style={sectionTextStyle}>
            Add flexible job information rows. Use Custom for special labels like
            category-wise vacancy or multiple posts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onChange([...quickInfoRows, createEmptyQuickInfoRow()])}
          style={addButtonStyle}
        >
          + Add Info
        </button>
      </div>

      <div style={{ display: "grid", gap: "12px" }}>
        {quickInfoRows.length === 0 ? (
          <p style={emptyTextStyle}>No quick information rows added.</p>
        ) : null}

        {quickInfoRows.map((row, index) => (
          <div key={row.id} style={rowCardStyle}>
            <div style={rowTopStyle}>
              <strong style={{ color: "#0f172a" }}>Info Row {index + 1}</strong>

              <button
                type="button"
                onClick={() => removeRow(row.id)}
                style={removeButtonStyle}
              >
                Remove
              </button>
            </div>

            <div style={gridStyle}>
              <label style={labelStyle}>
                Info Type
                <select
                  value={row.type}
                  onChange={(e) => updateRow(row.id, "type", e.target.value)}
                  style={inputStyle}
                >
                  {QUICK_INFO_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              {row.type === "Custom" ? (
                <label style={labelStyle}>
                  Custom Info Label
                  <input
                    value={row.label}
                    onChange={(e) =>
                      updateRow(row.id, "label", e.target.value)
                    }
                    placeholder="Example: Category Wise Vacancy"
                    style={inputStyle}
                  />
                </label>
              ) : null}

              <label style={labelStyle}>
                Info Value
                <input
                  value={row.value}
                  onChange={(e) => updateRow(row.id, "value", e.target.value)}
                  placeholder="Example: 74 Posts"
                  style={inputStyle}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>
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