"use client";

import type { RequiredDocumentRow } from "@/lib/jobDetails";

export const COMMON_DOCUMENT_SUGGESTIONS = [
  "Aadhaar Card",
  "Passport Size Photograph",
  "Signature",
  "Mobile Number",
  "Email ID",
  "10th Certificate / Mark Sheet",
  "+2 Certificate / Mark Sheet",
  "Graduation Certificate / Mark Sheet",
  "Residence Certificate",
  "Income Certificate",
  "Caste Certificate",
  "Disability Certificate",
  "Bank Passbook",
  "Application / Registration Number",
  "Admit Card",
];

function createDocument(): RequiredDocumentRow {
  return {
    id: `document_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    required: true,
  };
}

type CommonDocumentsEditorProps = {
  documents: RequiredDocumentRow[];
  onChange: (documents: RequiredDocumentRow[]) => void;
  title?: string;
};

export default function CommonDocumentsEditor({
  documents,
  onChange,
  title = "Documents Required",
}: CommonDocumentsEditorProps) {
  const suggestionId = `document-suggestions-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <section className="admin-section-box">
      <div className="admin-section-title-row">
        <div>
          <h3>{title}</h3>
          <p className="common-documents-help">
            Choose a suggested document or type any document name.
          </p>
        </div>
        <button
          type="button"
          className="admin-small-btn"
          onClick={() => onChange([...documents, createDocument()])}
        >
          + Add Document
        </button>
      </div>

      <datalist id={suggestionId}>
        {COMMON_DOCUMENT_SUGGESTIONS.map((item) => (
          <option value={item} key={item} />
        ))}
      </datalist>

      {documents.length === 0 ? (
        <p className="common-documents-empty">
          This optional section will remain hidden on the public page until a
          document is added.
        </p>
      ) : (
        <div className="common-documents-list">
          {documents.map((document, index) => (
            <div className="common-document-row" key={document.id || index}>
              <span>{index + 1}</span>
              <input
                list={suggestionId}
                value={document.name}
                onChange={(event) =>
                  onChange(
                    documents.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, name: event.target.value }
                        : item
                    )
                  )
                }
                placeholder="Document name"
              />
              <label>
                <input
                  type="checkbox"
                  checked={document.required !== false}
                  onChange={(event) =>
                    onChange(
                      documents.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, required: event.target.checked }
                          : item
                      )
                    )
                  }
                />
                Required
              </label>
              <button
                type="button"
                className="admin-danger-btn"
                onClick={() =>
                  onChange(
                    documents.filter((_, itemIndex) => itemIndex !== index)
                  )
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .common-documents-help,
        .common-documents-empty {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }
        .common-documents-list {
          display: grid;
          gap: 10px;
          margin-top: 14px;
        }
        .common-document-row {
          display: grid;
          grid-template-columns: auto minmax(180px, 1fr) auto auto;
          align-items: center;
          gap: 10px;
        }
        .common-document-row > span {
          color: #64748b;
          font-weight: 800;
        }
        .common-document-row input[type="text"],
        .common-document-row input:not([type]) {
          min-width: 0;
        }
        .common-document-row label {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .common-document-row label input {
          width: 16px;
          height: 16px;
        }
        @media (max-width: 680px) {
          .common-document-row {
            grid-template-columns: auto minmax(0, 1fr);
          }
          .common-document-row label,
          .common-document-row button {
            grid-column: 2;
            width: fit-content;
          }
        }
      `}</style>
    </section>
  );
}
