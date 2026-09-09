"use client";

import { useState } from "react";
import {
  getImageUploadErrorMessage,
  uploadImageFile,
} from "@/lib/clientImageUpload";
import {
  FlexibleDataTable,
  FlexibleDetailSection,
  createFlexibleDataTable,
  createFlexibleDetailSection,
  createFlexibleTableRow,
} from "@/lib/flexibleDetails";

type Props = {
  detailSections: FlexibleDetailSection[];
  dataTables: FlexibleDataTable[];
  onDetailSectionsChange: (sections: FlexibleDetailSection[]) => void;
  onDataTablesChange: (tables: FlexibleDataTable[]) => void;
  sectionLabel?: string;
  enableOdia?: boolean;
};

function makeCloneId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function FlexibleDetailsEditor({
  detailSections,
  dataTables,
  onDetailSectionsChange,
  onDataTablesChange,
  sectionLabel = "Optional Details and Data Tables",
  enableOdia = false,
}: Props) {
  const [uploadingKey, setUploadingKey] = useState("");
  const [uploadError, setUploadError] = useState("");

  async function uploadImage(
    file: File | undefined,
    key: string,
    onUploaded: (url: string) => void
  ) {
    try {
      setUploadingKey(key);
      setUploadError("");
      onUploaded(
        await uploadImageFile(file, {
          folder: "detail-media",
          fallbackName: "detail-image",
        })
      );
    } catch (error) {
      console.error(error);
      setUploadError(getImageUploadErrorMessage(error));
    } finally {
      setUploadingKey("");
    }
  }

  function updateSection(
    id: string,
    field: "title" | "content" | "titleOdia" | "contentOdia",
    value: string
  ) {
    onDetailSectionsChange(
      detailSections.map((section) =>
        section.id === id ? { ...section, [field]: value } : section
      )
    );
  }

  function updateSectionImage(sectionId: string, imageIndex: number, value: string) {
    onDetailSectionsChange(
      detailSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              imageUrls: section.imageUrls.map((imageUrl, index) =>
                index === imageIndex ? value : imageUrl
              ),
            }
          : section
      )
    );
  }

  function updateTable(
    tableId: string,
    field: "title" | "imageUrl" | "note" | "titleOdia" | "noteOdia",
    value: string
  ) {
    onDataTablesChange(
      dataTables.map((table) =>
        table.id === tableId ? { ...table, [field]: value } : table
      )
    );
  }

  function updateColumn(
    tableId: string,
    columnIndex: number,
    value: string,
    odia = false
  ) {
    onDataTablesChange(
      dataTables.map((table) => {
        if (table.id !== tableId) return table;
        if (odia) {
          const columnsOdia = Array.from(
            { length: table.columns.length },
            (_, index) => table.columnsOdia?.[index] || ""
          );
          columnsOdia[columnIndex] = value;
          return { ...table, columnsOdia };
        }
        return {
          ...table,
          columns: table.columns.map((column, index) =>
            index === columnIndex ? value : column
          ),
        };
      })
    );
  }

  function updateCell(
    tableId: string,
    rowId: string,
    cellIndex: number,
    value: string,
    odia = false
  ) {
    onDataTablesChange(
      dataTables.map((table) => {
        if (table.id !== tableId) return table;
        return {
          ...table,
          rows: table.rows.map((row) => {
            if (row.id !== rowId) return row;
            if (odia) {
              const cellsOdia = Array.from(
                { length: table.columns.length },
                (_, index) => row.cellsOdia?.[index] || ""
              );
              cellsOdia[cellIndex] = value;
              return { ...row, cellsOdia };
            }
            return {
              ...row,
              cells: row.cells.map((cell, index) =>
                index === cellIndex ? value : cell
              ),
            };
          }),
        };
      })
    );
  }

  function addColumn(tableId: string) {
    onDataTablesChange(
      dataTables.map((table) =>
        table.id === tableId && table.columns.length < 6
          ? {
              ...table,
              columns: [...table.columns, `Column ${table.columns.length + 1}`],
              columnsOdia: [...(table.columnsOdia || []), ""],
              rows: table.rows.map((row) => ({
                ...row,
                cells: [...row.cells, ""],
                cellsOdia: [...(row.cellsOdia || []), ""],
              })),
            }
          : table
      )
    );
  }

  function removeColumn(tableId: string, columnIndex: number) {
    onDataTablesChange(
      dataTables.map((table) =>
        table.id === tableId && table.columns.length > 1
          ? {
              ...table,
              columns: table.columns.filter((_, index) => index !== columnIndex),
              columnsOdia: (table.columnsOdia || []).filter(
                (_, index) => index !== columnIndex
              ),
              rows: table.rows.map((row) => ({
                ...row,
                cells: row.cells.filter((_, index) => index !== columnIndex),
                cellsOdia: (row.cellsOdia || []).filter(
                  (_, index) => index !== columnIndex
                ),
              })),
            }
          : table
      )
    );
  }

  function duplicateTable(table: FlexibleDataTable) {
    const cloned: FlexibleDataTable = {
      ...table,
      id: makeCloneId("table"),
      title: table.title ? `${table.title} Copy` : "",
      rows: table.rows.map((row) => ({
        ...row,
        id: makeCloneId("table_row"),
        cells: [...row.cells],
        cellsOdia: [...(row.cellsOdia || [])],
      })),
      columns: [...table.columns],
      columnsOdia: [...(table.columnsOdia || [])],
    };
    onDataTablesChange([...dataTables, cloned]);
  }

  function duplicateRow(tableId: string, rowId: string) {
    onDataTablesChange(
      dataTables.map((table) => {
        if (table.id !== tableId) return table;
        const row = table.rows.find((item) => item.id === rowId);
        if (!row) return table;
        const index = table.rows.findIndex((item) => item.id === rowId);
        const clone = {
          ...row,
          id: makeCloneId("table_row"),
          cells: [...row.cells],
          cellsOdia: [...(row.cellsOdia || [])],
        };
        return {
          ...table,
          rows: [
            ...table.rows.slice(0, index + 1),
            clone,
            ...table.rows.slice(index + 1),
          ],
        };
      })
    );
  }

  return (
    <section className="flex-details-editor" data-admin-section="optional-details">
      <div className="flex-editor-heading">
        <div>
          <h3>{sectionLabel}</h3>
          <p>Add only what you need. Empty items never appear publicly.</p>
        </div>
        <div className="flex-editor-quick-actions">
          <button
            type="button"
            onClick={() =>
              onDetailSectionsChange([
                ...detailSections,
                createFlexibleDetailSection(),
              ])
            }
          >
            + Detail
          </button>
          <button
            type="button"
            onClick={() =>
              onDataTablesChange([...dataTables, createFlexibleDataTable()])
            }
          >
            + Table
          </button>
        </div>
      </div>

      <details open={detailSections.length > 0}>
        <summary>Detail boxes <span>{detailSections.length}</span></summary>
        <div className="flex-editor-body">
          {detailSections.length === 0 ? (
            <p className="flex-empty">No detail boxes added.</p>
          ) : null}
          {detailSections.map((section, sectionIndex) => (
            <details className="flex-editor-card" key={section.id}>
              <summary className="flex-editor-card-summary">
                <strong>{section.title.trim() || `Detail Box ${sectionIndex + 1}`}</strong>
                <span>{section.content.trim() ? "Filled" : "Optional"}</span>
              </summary>
              <div className="flex-editor-card-body">
                <div className="flex-editor-card-head">
                  <strong>English</strong>
                  <button
                    type="button"
                    className="danger"
                    onClick={() =>
                      onDetailSectionsChange(
                        detailSections.filter((item) => item.id !== section.id)
                      )
                    }
                  >
                    Remove
                  </button>
                </div>

                <input
                  value={section.title}
                  onChange={(event) =>
                    updateSection(section.id, "title", event.target.value)
                  }
                  placeholder="Section title, e.g. How to Apply"
                />
                <textarea
                  value={section.content}
                  onChange={(event) =>
                    updateSection(section.id, "content", event.target.value)
                  }
                  placeholder="Section content"
                  rows={4}
                />

                {enableOdia ? (
                  <details className="flex-odia-box">
                    <summary>ଓଡ଼ିଆ translation (optional)</summary>
                    <input
                      value={section.titleOdia || ""}
                      onChange={(event) =>
                        updateSection(section.id, "titleOdia", event.target.value)
                      }
                      placeholder="ଓଡ଼ିଆ section title"
                    />
                    <textarea
                      value={section.contentOdia || ""}
                      onChange={(event) =>
                        updateSection(section.id, "contentOdia", event.target.value)
                      }
                      placeholder="ଓଡ଼ିଆ content"
                      rows={4}
                    />
                  </details>
                ) : null}

                <div className="flex-image-list">
                  {section.imageUrls.map((imageUrl, imageIndex) => (
                    <div className="flex-image-row" key={imageIndex}>
                      <div>
                        <input
                          value={imageUrl}
                          onChange={(event) =>
                            updateSectionImage(
                              section.id,
                              imageIndex,
                              event.target.value
                            )
                          }
                          placeholder="Image URL"
                        />
                        {imageUrl.trim() ? (
                          <img
                            src={imageUrl.trim()}
                            alt={`Detail preview ${imageIndex + 1}`}
                          />
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          onDetailSectionsChange(
                            detailSections.map((item) =>
                              item.id === section.id
                                ? {
                                    ...item,
                                    imageUrls: item.imageUrls.filter(
                                      (_, index) => index !== imageIndex
                                    ),
                                  }
                                : item
                            )
                          )
                        }
                      >
                        Remove image
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex-editor-actions">
                  <button
                    type="button"
                    onClick={() =>
                      onDetailSectionsChange(
                        detailSections.map((item) =>
                          item.id === section.id
                            ? { ...item, imageUrls: [...item.imageUrls, ""] }
                            : item
                        )
                      )
                    }
                  >
                    + Image link
                  </button>
                  <label className="upload-label">
                    {uploadingKey === section.id ? "Uploading…" : "Upload image"}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={Boolean(uploadingKey)}
                      onChange={(event) => {
                        uploadImage(event.target.files?.[0], section.id, (url) =>
                          onDetailSectionsChange(
                            detailSections.map((item) =>
                              item.id === section.id
                                ? { ...item, imageUrls: [...item.imageUrls, url] }
                                : item
                            )
                          )
                        );
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            </details>
          ))}
        </div>
      </details>

      <details open={dataTables.length > 0}>
        <summary>Custom data tables <span>{dataTables.length}</span></summary>
        <div className="flex-editor-body">
          {dataTables.length === 0 ? (
            <p className="flex-empty">No custom tables added.</p>
          ) : null}
          {dataTables.map((table, tableIndex) => (
            <details className="flex-editor-card" key={table.id}>
              <summary className="flex-editor-card-summary">
                <strong>{table.title.trim() || `Data Table ${tableIndex + 1}`}</strong>
                <span>{table.rows.length} row{table.rows.length === 1 ? "" : "s"}</span>
              </summary>
              <div className="flex-editor-card-body">
                <div className="flex-editor-card-head">
                  <strong>Table {tableIndex + 1}</strong>
                  <div className="flex-inline-actions">
                    <button type="button" onClick={() => duplicateTable(table)}>
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        onDataTablesChange(
                          dataTables.filter((item) => item.id !== table.id)
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <input
                  value={table.title}
                  onChange={(event) =>
                    updateTable(table.id, "title", event.target.value)
                  }
                  placeholder="Table title (optional)"
                />

                <div>
                  <input
                    value={table.imageUrl}
                    onChange={(event) =>
                      updateTable(table.id, "imageUrl", event.target.value)
                    }
                    placeholder="Optional image URL above table"
                  />
                  {table.imageUrl.trim() ? (
                    <img
                      className="flex-table-image-preview"
                      src={table.imageUrl.trim()}
                      alt={`${table.title || "Table"} preview`}
                    />
                  ) : null}
                  <label className="upload-label table-upload">
                    {uploadingKey === table.id ? "Uploading…" : "Upload table image"}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={Boolean(uploadingKey)}
                      onChange={(event) => {
                        uploadImage(event.target.files?.[0], table.id, (url) =>
                          updateTable(table.id, "imageUrl", url)
                        );
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>

                <div className="flex-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        {table.columns.map((column, columnIndex) => (
                          <th key={columnIndex}>
                            <div className="flex-column-head">
                              <input
                                value={column}
                                onChange={(event) =>
                                  updateColumn(
                                    table.id,
                                    columnIndex,
                                    event.target.value
                                  )
                                }
                                placeholder={`Column ${columnIndex + 1}`}
                              />
                              {table.columns.length > 1 ? (
                                <button
                                  type="button"
                                  className="danger compact"
                                  onClick={() => removeColumn(table.id, columnIndex)}
                                  aria-label={`Remove column ${columnIndex + 1}`}
                                >
                                  ×
                                </button>
                              ) : null}
                            </div>
                          </th>
                        ))}
                        <th aria-label="Row actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row) => (
                        <tr key={row.id}>
                          {table.columns.map((_, cellIndex) => (
                            <td key={cellIndex}>
                              <textarea
                                value={row.cells[cellIndex] || ""}
                                onChange={(event) =>
                                  updateCell(
                                    table.id,
                                    row.id,
                                    cellIndex,
                                    event.target.value
                                  )
                                }
                                rows={2}
                              />
                            </td>
                          ))}
                          <td>
                            <div className="flex-row-actions">
                              <button
                                type="button"
                                className="compact"
                                onClick={() => duplicateRow(table.id, row.id)}
                                title="Duplicate row"
                              >
                                ⧉
                              </button>
                              <button
                                type="button"
                                className="danger compact"
                                onClick={() =>
                                  onDataTablesChange(
                                    dataTables.map((item) =>
                                      item.id === table.id
                                        ? {
                                            ...item,
                                            rows: item.rows.filter(
                                              (candidate) => candidate.id !== row.id
                                            ),
                                          }
                                        : item
                                    )
                                  )
                                }
                                title="Remove row"
                              >
                                ×
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex-editor-actions">
                  <button
                    type="button"
                    onClick={() =>
                      onDataTablesChange(
                        dataTables.map((item) =>
                          item.id === table.id
                            ? {
                                ...item,
                                rows: [
                                  ...item.rows,
                                  createFlexibleTableRow(item.columns.length),
                                ],
                              }
                            : item
                        )
                      )
                    }
                  >
                    + Row
                  </button>
                  <button
                    type="button"
                    disabled={table.columns.length >= 6}
                    onClick={() => addColumn(table.id)}
                  >
                    + Column
                  </button>
                </div>

                <label className="flex-note-field">
                  <span>Table Note / Important Note <small>(optional)</small></span>
                  <textarea
                    value={table.note || ""}
                    onChange={(event) =>
                      updateTable(table.id, "note", event.target.value)
                    }
                    rows={2}
                    placeholder="Shown immediately below this table only when entered."
                  />
                </label>

                {enableOdia ? (
                  <details className="flex-odia-box">
                    <summary>ଓଡ଼ିଆ table text (optional)</summary>
                    <input
                      value={table.titleOdia || ""}
                      onChange={(event) =>
                        updateTable(table.id, "titleOdia", event.target.value)
                      }
                      placeholder="ଓଡ଼ିଆ table title"
                    />
                    <div className="flex-table-scroll">
                      <table>
                        <thead>
                          <tr>
                            {table.columns.map((column, columnIndex) => (
                              <th key={columnIndex}>
                                <input
                                  value={table.columnsOdia?.[columnIndex] || ""}
                                  onChange={(event) =>
                                    updateColumn(
                                      table.id,
                                      columnIndex,
                                      event.target.value,
                                      true
                                    )
                                  }
                                  placeholder={`${column} — ଓଡ଼ିଆ`}
                                />
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows.map((row) => (
                            <tr key={row.id}>
                              {table.columns.map((_, cellIndex) => (
                                <td key={cellIndex}>
                                  <textarea
                                    value={row.cellsOdia?.[cellIndex] || ""}
                                    onChange={(event) =>
                                      updateCell(
                                        table.id,
                                        row.id,
                                        cellIndex,
                                        event.target.value,
                                        true
                                      )
                                    }
                                    rows={2}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <label className="flex-note-field">
                      <span>ଓଡ଼ିଆ table note</span>
                      <textarea
                        value={table.noteOdia || ""}
                        onChange={(event) =>
                          updateTable(table.id, "noteOdia", event.target.value)
                        }
                        rows={2}
                        placeholder="ଓଡ଼ିଆ note (English is used when blank)"
                      />
                    </label>
                  </details>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      </details>

      {uploadError ? <p className="flex-upload-error">{uploadError}</p> : null}

      <style jsx>{`
        .flex-details-editor{overflow:hidden;border:1px solid #dbe3ee;border-radius:14px;background:#fff}
        .flex-editor-heading{padding:12px 13px;border-bottom:1px solid #e2e8f0;background:#f8fafc;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
        h3,p{margin:0} h3{color:#0f172a;font-size:16px;font-weight:900} p{margin-top:3px;color:#64748b;font-size:12px}
        .flex-editor-quick-actions,.flex-editor-actions,.flex-inline-actions,.flex-row-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
        details{border-bottom:1px solid #e2e8f0} details:last-of-type{border-bottom:0}
        summary{list-style:none;cursor:pointer;padding:11px 13px;color:#0f172a;font-size:13px;font-weight:900;display:flex;align-items:center;justify-content:space-between;gap:8px}
        summary::-webkit-details-marker{display:none} summary:after{content:"▾";margin-left:auto;color:#64748b} details[open]>summary:after{transform:rotate(180deg)}
        summary span{color:#64748b;font-size:11px;font-weight:800;margin-left:6px}
        .flex-editor-body{display:grid;gap:10px;padding:0 12px 12px}
        .flex-editor-card{border:1px solid #e2e8f0!important;border-radius:11px;background:#f8fafc;overflow:hidden}
        .flex-editor-card-summary{padding:9px 10px;background:#fff;border-bottom:0}
        .flex-editor-card[open]>.flex-editor-card-summary{border-bottom:1px solid #e2e8f0}
        .flex-editor-card-body{display:grid;gap:9px;padding:10px}
        .flex-editor-card-head,.flex-image-row{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex-wrap:wrap}
        input,textarea{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:8px;padding:8px 9px;background:#fff;color:#0f172a;font:inherit;resize:vertical}
        input[type="file"]{display:none}
        button,.upload-label{width:fit-content;border:1px solid #cbd5e1;border-radius:8px;padding:7px 10px;background:#fff;color:#1d4ed8;font-size:12px;font-weight:850;cursor:pointer;text-decoration:none}
        button:hover,.upload-label:hover{background:#eff6ff} button.danger{border-color:#fecaca;background:#fff1f2;color:#be123c} button.compact{padding:4px 7px} button:disabled{cursor:not-allowed;opacity:.55}
        .upload-label{display:inline-flex;align-items:center}.table-upload{margin-top:7px}.flex-upload-error{margin:0 12px 12px;color:#b91c1c;font-size:12px;font-weight:800}
        .flex-image-list{display:grid;gap:8px}.flex-image-row>div{flex:1 1 280px}.flex-image-row img,.flex-table-image-preview{display:block;width:min(100%,520px);max-height:220px;margin-top:7px;object-fit:contain;border:1px solid #e2e8f0;border-radius:9px;background:#fff}
        .flex-table-scroll{width:100%;overflow-x:auto;overscroll-behavior-inline:contain} table{width:100%;min-width:560px;border-collapse:collapse} th,td{min-width:140px;padding:6px;border:1px solid #dbe3ee;vertical-align:top} th:last-child,td:last-child{width:70px;min-width:70px;text-align:center} th{background:#eff6ff}.flex-column-head{display:flex;gap:5px;align-items:flex-start}.flex-column-head input{min-width:0}.flex-row-actions{justify-content:center;flex-wrap:nowrap}
        .flex-note-field{display:grid;gap:5px;color:#334155;font-size:12px;font-weight:850}.flex-note-field small{color:#64748b;font-weight:700}.flex-odia-box{border:1px dashed #cbd5e1!important;border-radius:9px;background:#fff}.flex-odia-box>summary{padding:8px 9px;color:#7c3aed}.flex-odia-box[open]{padding-bottom:9px}.flex-odia-box[open]>input,.flex-odia-box[open]>textarea,.flex-odia-box[open]>.flex-table-scroll,.flex-odia-box[open]>.flex-note-field{width:calc(100% - 18px);margin:8px 9px 0}.flex-empty{margin:0;padding:9px;border-radius:8px;background:#f8fafc;color:#64748b;font-size:12px}
        @media(max-width:600px){.flex-editor-heading{align-items:flex-start}.flex-editor-quick-actions{width:100%}.flex-editor-quick-actions button{flex:1}.flex-editor-card-head{align-items:center}.flex-table-scroll{margin-inline:-2px;width:calc(100% + 4px)}table{min-width:620px}.flex-editor-actions button,.flex-editor-actions .upload-label{flex:1;justify-content:center}.flex-inline-actions{width:100%}.flex-inline-actions button{flex:1}}
      `}</style>
    </section>
  );
}
