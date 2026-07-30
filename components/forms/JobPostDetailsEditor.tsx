"use client";

import {
  DEFAULT_VACANCY_CATEGORIES,
  AgeCriteriaRow,
  JobInfoPanel,
  VacancyCategoryRow,
  createAgeCriteriaRow,
  createJobInfoPanel,
  createVacancyRow,
} from "@/lib/jobDetails";

type JobPostDetailsEditorProps = {
  panels: JobInfoPanel[];
  onChange: (panels: JobInfoPanel[]) => void;
};

function isDefaultVacancyCategory(value: string) {
  return DEFAULT_VACANCY_CATEGORIES.some(
    (item) => item.toLowerCase() === value.toLowerCase()
  );
}

export default function JobPostDetailsEditor({
  panels,
  onChange,
}: JobPostDetailsEditorProps) {
  const updatePanel = (
    panelId: string,
    updater: (panel: JobInfoPanel) => JobInfoPanel
  ) => {
    onChange(
      panels.map((panel) => (panel.id === panelId ? updater(panel) : panel))
    );
  };

  const updateBasicField = (
    panelId: string,
    field: keyof Pick<
      JobInfoPanel,
      | "organization"
      | "postName"
      | "totalVacancy"
      | "applicationMode"
      | "qualification"
      | "ageLimit"
      | "ageCutoffDate"
      | "salary"
    >,
    value: string
  ) => {
    updatePanel(panelId, (panel) => ({ ...panel, [field]: value }));
  };

  const updateVacancyRow = (
    panelId: string,
    rowId: string,
    field: keyof Omit<VacancyCategoryRow, "id">,
    value: string
  ) => {
    updatePanel(panelId, (panel) => ({
      ...panel,
      vacancyCategories: panel.vacancyCategories.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      ),
    }));
  };

  const updateAgeRow = (
    panelId: string,
    rowId: string,
    field: keyof Omit<AgeCriteriaRow, "id">,
    value: string
  ) => {
    updatePanel(panelId, (panel) => ({
      ...panel,
      ageCriteria: panel.ageCriteria.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      ),
    }));
  };

  return (
    <section className="job-editor-section">
      <div className="job-editor-heading">
        <div>
          <h3>Post-specific information</h3>
          <p>Add one compact card for each post in this recruitment.</p>
        </div>

        <button
          type="button"
          className="job-editor-add-main"
          onClick={() => onChange([...panels, createJobInfoPanel()])}
        >
          + Add another post
        </button>
      </div>

      <div className="job-editor-panel-list">
        {panels.map((panel, index) => {
          return (
            <article className="job-editor-panel" key={panel.id}>
              <div className="job-editor-panel-top">
                <div>
                  <span>Post {index + 1}</span>
                  <strong>{panel.postName.trim() || "Post name not entered"}</strong>
                </div>

                {panels.length > 1 ? (
                  <button
                    type="button"
                    className="job-editor-remove"
                    onClick={() =>
                      onChange(panels.filter((item) => item.id !== panel.id))
                    }
                  >
                    Remove post
                  </button>
                ) : null}
              </div>

              <details className="job-editor-details" open={index === 0}>
                <summary>Basic post details</summary>
                <div className="job-editor-grid">
                  <label>
                    Organization / Department
                    <input
                      value={panel.organization}
                      onChange={(event) =>
                        updateBasicField(
                          panel.id,
                          "organization",
                          event.target.value
                        )
                      }
                      placeholder="Example: OSSC"
                    />
                  </label>

                  <label>
                    Post Name
                    <input
                      value={panel.postName}
                      onChange={(event) =>
                        updateBasicField(panel.id, "postName", event.target.value)
                      }
                      placeholder="Example: Junior Assistant"
                    />
                  </label>

                  <label>
                    Total Vacancy
                    <input
                      value={panel.totalVacancy}
                      onChange={(event) =>
                        updateBasicField(
                          panel.id,
                          "totalVacancy",
                          event.target.value
                        )
                      }
                      placeholder="Example: 74"
                    />
                  </label>

                  <label>
                    Mode of Application
                    <select
                      value={panel.applicationMode}
                      onChange={(event) =>
                        updateBasicField(
                          panel.id,
                          "applicationMode",
                          event.target.value
                        )
                      }
                    >
                      <option value="">Select when required</option>
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                      <option value="Online / Offline">Online / Offline</option>
                      <option value="Walk-in">Walk-in</option>
                      <option value="Through CSC / Jan Seva Kendra">
                        Through CSC / Jan Seva Kendra
                      </option>
                    </select>
                  </label>

                  <label>
                    Salary / Pay Scale
                    <input
                      value={panel.salary}
                      onChange={(event) =>
                        updateBasicField(panel.id, "salary", event.target.value)
                      }
                      placeholder="Example: ₹19,900 – ₹63,200"
                    />
                  </label>
                </div>
              </details>

              <details className="job-editor-details">
                <summary>Category-wise vacancy</summary>
                <div className="job-editor-table-wrap">
                  <table className="job-editor-table vacancy">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Total</th>
                        <th>Male</th>
                        <th>Female</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {panel.vacancyCategories.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <input
                              aria-label="Vacancy category"
                              value={row.category}
                              onChange={(event) =>
                                updateVacancyRow(
                                  panel.id,
                                  row.id,
                                  "category",
                                  event.target.value
                                )
                              }
                              placeholder="Category"
                            />
                          </td>
                          <td>
                            <input
                              aria-label={`${row.category} total vacancy`}
                              inputMode="numeric"
                              value={row.total}
                              onChange={(event) =>
                                updateVacancyRow(
                                  panel.id,
                                  row.id,
                                  "total",
                                  event.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              aria-label={`${row.category} male vacancy`}
                              inputMode="numeric"
                              value={row.male}
                              onChange={(event) =>
                                updateVacancyRow(
                                  panel.id,
                                  row.id,
                                  "male",
                                  event.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              aria-label={`${row.category} female vacancy`}
                              inputMode="numeric"
                              value={row.female}
                              onChange={(event) =>
                                updateVacancyRow(
                                  panel.id,
                                  row.id,
                                  "female",
                                  event.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            {!isDefaultVacancyCategory(row.category) ? (
                              <button
                                type="button"
                                className="job-editor-icon-remove"
                                onClick={() =>
                                  updatePanel(panel.id, (current) => ({
                                    ...current,
                                    vacancyCategories:
                                      current.vacancyCategories.filter(
                                        (item) => item.id !== row.id
                                      ),
                                  }))
                                }
                                aria-label={`Remove ${row.category || "custom category"}`}
                              >
                                ×
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  className="job-editor-add-row"
                  onClick={() =>
                    updatePanel(panel.id, (current) => ({
                      ...current,
                      vacancyCategories: [
                        ...current.vacancyCategories,
                        createVacancyRow("Other"),
                      ],
                    }))
                  }
                >
                  + Add another vacancy category
                </button>
              </details>

              <details className="job-editor-details">
                <summary>Age criteria</summary>
                <div className="job-editor-grid">
                  <label>
                    General Age Limit
                    <input
                      value={panel.ageLimit}
                      onChange={(event) =>
                        updateBasicField(panel.id, "ageLimit", event.target.value)
                      }
                      placeholder="Example: 21 to 38 Years"
                    />
                  </label>

                  <label>
                    Age calculated as on
                    <input
                      value={panel.ageCutoffDate}
                      onChange={(event) =>
                        updateBasicField(
                          panel.id,
                          "ageCutoffDate",
                          event.target.value
                        )
                      }
                      placeholder="Example: 01 January 2026"
                    />
                  </label>
                </div>

                {panel.ageCriteria.length > 0 ? (
                  <div className="job-editor-table-wrap">
                    <table className="job-editor-table age">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Minimum</th>
                          <th>Maximum</th>
                          <th>Relaxation / Remarks</th>
                          <th aria-label="Actions" />
                        </tr>
                      </thead>
                      <tbody>
                        {panel.ageCriteria.map((row) => (
                          <tr key={row.id}>
                            <td>
                              <input
                                value={row.category}
                                onChange={(event) =>
                                  updateAgeRow(
                                    panel.id,
                                    row.id,
                                    "category",
                                    event.target.value
                                  )
                                }
                                placeholder="Example: SC/ST"
                              />
                            </td>
                            <td>
                              <input
                                value={row.minimumAge}
                                onChange={(event) =>
                                  updateAgeRow(
                                    panel.id,
                                    row.id,
                                    "minimumAge",
                                    event.target.value
                                  )
                                }
                                placeholder="21 Years"
                              />
                            </td>
                            <td>
                              <input
                                value={row.maximumAge}
                                onChange={(event) =>
                                  updateAgeRow(
                                    panel.id,
                                    row.id,
                                    "maximumAge",
                                    event.target.value
                                  )
                                }
                                placeholder="43 Years"
                              />
                            </td>
                            <td>
                              <input
                                value={row.relaxation}
                                onChange={(event) =>
                                  updateAgeRow(
                                    panel.id,
                                    row.id,
                                    "relaxation",
                                    event.target.value
                                  )
                                }
                                placeholder="5 years relaxation"
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                className="job-editor-icon-remove"
                                onClick={() =>
                                  updatePanel(panel.id, (current) => ({
                                    ...current,
                                    ageCriteria: current.ageCriteria.filter(
                                      (item) => item.id !== row.id
                                    ),
                                  }))
                                }
                                aria-label={`Remove ${row.category || "age category"}`}
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

                <button
                  type="button"
                  className="job-editor-add-row"
                  onClick={() =>
                    updatePanel(panel.id, (current) => ({
                      ...current,
                      ageCriteria: [
                        ...current.ageCriteria,
                        createAgeCriteriaRow(),
                      ],
                    }))
                  }
                >
                  + Add category-wise age
                </button>
              </details>

              <details className="job-editor-details">
                <summary>Educational qualification</summary>
                <label className="job-editor-full-label">
                  Qualification for {panel.postName.trim() || `Post ${index + 1}`}
                  <textarea
                    value={panel.qualification}
                    onChange={(event) =>
                      updateBasicField(
                        panel.id,
                        "qualification",
                        event.target.value
                      )
                    }
                    rows={4}
                    placeholder="Enter the exact post-specific educational qualification"
                  />
                </label>
              </details>

            </article>
          );
        })}
      </div>

      <style jsx>{`
        .job-editor-section {
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: #ffffff;
          padding: 16px;
        }

        .job-editor-heading,
        .job-editor-panel-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .job-editor-heading {
          margin-bottom: 14px;
        }

        .job-editor-heading h3 {
          margin: 0;
          color: #0f172a;
          font-size: 18px;
          font-weight: 900;
        }

        .job-editor-heading p,
        .job-editor-note {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .job-editor-add-main,
        .job-editor-add-row,
        .job-editor-remove,
        .job-editor-icon-remove {
          border: 0;
          cursor: pointer;
          font-weight: 800;
        }

        .job-editor-add-main {
          flex: 0 0 auto;
          min-height: 38px;
          padding: 8px 13px;
          border-radius: 999px;
          background: #2563eb;
          color: #ffffff;
        }

        .job-editor-panel-list {
          display: grid;
          gap: 14px;
        }

        .job-editor-panel {
          border: 1px solid #dbe3ee;
          border-radius: 14px;
          background: #f8fafc;
          overflow: hidden;
        }

        .job-editor-panel-top {
          padding: 13px 14px;
          background: #eff6ff;
          border-bottom: 1px solid #dbeafe;
        }

        .job-editor-panel-top div {
          display: grid;
          gap: 2px;
        }

        .job-editor-panel-top span {
          color: #2563eb;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .job-editor-panel-top strong {
          color: #0f172a;
          font-size: 15px;
        }

        .job-editor-remove {
          padding: 6px 10px;
          border-radius: 999px;
          background: #fff1f2;
          color: #be123c;
        }

        .job-editor-details {
          border-bottom: 1px solid #e2e8f0;
          background: #ffffff;
        }

        .job-editor-details:last-child {
          border-bottom: 0;
        }

        .job-editor-details summary {
          padding: 12px 14px;
          color: #1e293b;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
          user-select: none;
        }

        .job-editor-details[open] summary {
          border-bottom: 1px solid #eef2f7;
          background: #f8fafc;
        }

        .job-editor-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          padding: 14px;
        }

        .job-editor-grid label,
        .job-editor-full-label {
          display: grid;
          gap: 6px;
          color: #334155;
          font-size: 13px;
          font-weight: 800;
        }

        .job-editor-full-label {
          padding: 14px;
        }

        input,
        textarea {
          box-sizing: border-box;
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          background: #ffffff;
          color: #0f172a;
          font: inherit;
          font-weight: 500;
          padding: 8px 9px;
          outline: none;
        }

        input {
          min-height: 38px;
        }

        textarea {
          resize: vertical;
          line-height: 1.55;
        }

        input:focus,
        textarea:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .job-editor-table-wrap {
          overflow-x: auto;
          padding: 12px 12px 0;
        }

        .job-editor-table {
          width: 100%;
          min-width: 650px;
          border-collapse: collapse;
        }

        .job-editor-table th,
        .job-editor-table td {
          border: 1px solid #e2e8f0;
          padding: 7px;
          text-align: left;
          font-size: 12px;
        }

        .job-editor-table th {
          background: #f8fafc;
          color: #334155;
          font-weight: 900;
        }

        .job-editor-table.vacancy th:not(:first-child),
        .job-editor-table.vacancy td:not(:first-child) {
          width: 105px;
        }

        .job-editor-table td:last-child,
        .job-editor-table th:last-child {
          width: 38px;
        }

        .job-editor-icon-remove {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #fff1f2;
          color: #be123c;
          font-size: 18px;
          line-height: 1;
        }

        .job-editor-add-row {
          margin: 12px;
          padding: 8px 11px;
          border-radius: 9px;
          background: #eff6ff;
          color: #1d4ed8;
        }

        .job-editor-note {
          padding: 0 14px;
        }

        @media (max-width: 700px) {
          .job-editor-section {
            padding: 12px;
          }

          .job-editor-heading,
          .job-editor-panel-top {
            align-items: stretch;
            flex-direction: column;
          }

          .job-editor-add-main,
          .job-editor-remove {
            width: 100%;
          }

          .job-editor-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
