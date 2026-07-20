"use client";

import {
  JobFeeRow,
  OPTIONAL_JOB_DOCUMENTS,
  REQUIRED_JOB_DOCUMENTS,
  RequiredDocumentRow,
  createJobFeeRow,
  createRequiredDocument,
} from "@/lib/jobDetails";

type JobCommonDetailsEditorProps = {
  feeRows: JobFeeRow[];
  documents: RequiredDocumentRow[];
  postNames: string[];
  onFeeRowsChange: (rows: JobFeeRow[]) => void;
  onDocumentsChange: (rows: RequiredDocumentRow[]) => void;
};

export default function JobCommonDetailsEditor({
  feeRows,
  documents,
  postNames,
  onFeeRowsChange,
  onDocumentsChange,
}: JobCommonDetailsEditorProps) {
  const updateFeeRow = (
    rowId: string,
    field: keyof Omit<JobFeeRow, "id">,
    value: string
  ) => {
    onFeeRowsChange(
      feeRows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
  };

  const hasDocument = (name: string) =>
    documents.some(
      (item) => item.name.toLowerCase() === name.toLowerCase() && item.required
    );

  const toggleOptionalDocument = (name: string, checked: boolean) => {
    const filtered = documents.filter(
      (item) => item.name.toLowerCase() !== name.toLowerCase()
    );

    onDocumentsChange(
      checked ? [...filtered, createRequiredDocument(name, true)] : filtered
    );
  };

  const customDocuments = documents.filter((item) => item.custom);

  return (
    <section className="job-common-editor">
      <div className="job-common-heading">
        <h3>Common recruitment information</h3>
        <p>
          Fee Structure and Documents Required are independent from the Post
          Details cards below.
        </p>
      </div>

      <details className="job-common-details">
        <summary>Fee Structure</summary>

        <p className="job-common-note">
          Add separate rows whenever fees differ by vacancy/post or applicant
          category. Leave this section empty when no fee information is available.
        </p>

        {feeRows.length > 0 ? (
          <div className="job-common-table-wrap">
            <table className="job-common-table">
              <thead>
                <tr>
                  <th>Post / Vacancy</th>
                  <th>Applicant Category</th>
                  <th>Fee</th>
                  <th>Remarks</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {feeRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input
                        list="job-fee-post-names"
                        value={row.postName}
                        onChange={(event) =>
                          updateFeeRow(row.id, "postName", event.target.value)
                        }
                        placeholder="All Posts or post name"
                      />
                    </td>
                    <td>
                      <input
                        value={row.category}
                        onChange={(event) =>
                          updateFeeRow(row.id, "category", event.target.value)
                        }
                        placeholder="General/OBC/SC/ST/PwD"
                      />
                    </td>
                    <td>
                      <input
                        value={row.fee}
                        onChange={(event) =>
                          updateFeeRow(row.id, "fee", event.target.value)
                        }
                        placeholder="₹500 or No Fee"
                      />
                    </td>
                    <td>
                      <input
                        value={row.remarks}
                        onChange={(event) =>
                          updateFeeRow(row.id, "remarks", event.target.value)
                        }
                        placeholder="Optional note"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="job-common-remove"
                        onClick={() =>
                          onFeeRowsChange(
                            feeRows.filter((item) => item.id !== row.id)
                          )
                        }
                        aria-label="Remove fee row"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <datalist id="job-fee-post-names">
          <option value="All Posts" />
          {postNames.map((name) => (
            <option value={name} key={name} />
          ))}
        </datalist>

        <button
          type="button"
          className="job-common-add"
          onClick={() => onFeeRowsChange([...feeRows, createJobFeeRow()])}
        >
          + Add fee detail
        </button>
      </details>

      <details className="job-common-details">
        <summary>Documents Required</summary>

        <p className="job-common-note">
          These documents apply once to the complete recruitment and all its
          vacancies. The five standard documents remain compulsory.
        </p>

        <div className="job-common-document-grid">
          {REQUIRED_JOB_DOCUMENTS.map((name) => (
            <label key={name} className="required">
              <input type="checkbox" checked readOnly />
              {name}
            </label>
          ))}

          {OPTIONAL_JOB_DOCUMENTS.map((name) => (
            <label key={name}>
              <input
                type="checkbox"
                checked={hasDocument(name)}
                onChange={(event) =>
                  toggleOptionalDocument(name, event.target.checked)
                }
              />
              {name}
            </label>
          ))}
        </div>

        {customDocuments.length > 0 ? (
          <div className="job-common-custom-documents">
            {customDocuments.map((item) => (
              <div key={item.id}>
                <input
                  value={item.name}
                  onChange={(event) =>
                    onDocumentsChange(
                      documents.map((document) =>
                        document.id === item.id
                          ? { ...document, name: event.target.value }
                          : document
                      )
                    )
                  }
                  placeholder="Custom document name"
                />
                <button
                  type="button"
                  className="job-common-remove"
                  onClick={() =>
                    onDocumentsChange(
                      documents.filter((document) => document.id !== item.id)
                    )
                  }
                  aria-label="Remove custom document"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          className="job-common-add"
          onClick={() =>
            onDocumentsChange([
              ...documents,
              createRequiredDocument("", true, true),
            ])
          }
        >
          + Add custom document
        </button>
      </details>

      <style jsx>{`
        .job-common-editor {
          overflow: hidden;
          border: 1px solid #dbe3ee;
          border-radius: 16px;
          background: #ffffff;
        }

        .job-common-heading {
          padding: 15px 16px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .job-common-heading h3 {
          margin: 0;
          color: #0f172a;
          font-size: 18px;
          font-weight: 900;
        }

        .job-common-heading p,
        .job-common-note {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .job-common-details {
          border-bottom: 1px solid #e2e8f0;
        }

        .job-common-details:last-of-type {
          border-bottom: 0;
        }

        .job-common-details summary {
          padding: 13px 16px;
          color: #1e293b;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
        }

        .job-common-details[open] summary {
          background: #eff6ff;
          border-bottom: 1px solid #dbeafe;
        }

        .job-common-note {
          padding: 0 14px;
        }

        .job-common-table-wrap {
          overflow-x: auto;
          padding: 12px 12px 0;
        }

        .job-common-table {
          width: 100%;
          min-width: 780px;
          border-collapse: collapse;
        }

        .job-common-table th,
        .job-common-table td {
          border: 1px solid #e2e8f0;
          padding: 7px;
          text-align: left;
          font-size: 12px;
        }

        .job-common-table th {
          background: #f8fafc;
          color: #334155;
          font-weight: 900;
        }

        .job-common-table th:last-child,
        .job-common-table td:last-child {
          width: 38px;
        }

        input {
          box-sizing: border-box;
          width: 100%;
          min-height: 38px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 8px 9px;
          background: #ffffff;
          color: #0f172a;
          font: inherit;
          font-weight: 500;
          outline: none;
        }

        input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .job-common-add,
        .job-common-remove {
          border: 0;
          cursor: pointer;
          font-weight: 800;
        }

        .job-common-add {
          margin: 12px;
          padding: 8px 11px;
          border-radius: 9px;
          background: #eff6ff;
          color: #1d4ed8;
        }

        .job-common-remove {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #fff1f2;
          color: #be123c;
          font-size: 18px;
          line-height: 1;
        }

        .job-common-document-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          padding: 12px 14px;
        }

        .job-common-document-grid label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          background: #ffffff;
          color: #334155;
          font-size: 12px;
          font-weight: 750;
        }

        .job-common-document-grid label.required {
          border-color: #bbf7d0;
          background: #f0fdf4;
          color: #166534;
        }

        .job-common-document-grid input[type="checkbox"] {
          width: 16px;
          min-height: 16px;
          padding: 0;
          accent-color: #2563eb;
        }

        .job-common-custom-documents {
          display: grid;
          gap: 8px;
          padding: 0 14px;
        }

        .job-common-custom-documents > div {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 700px) {
          .job-common-document-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
